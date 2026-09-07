import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { computeAtsScore } from "../_shared/atsScore.ts";
import { callAi } from "../_shared/aiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Enforce monthly scan quota atomically
    const { data: gate, error: gateErr } = await admin.rpc("consume_scan", { _user_id: userId });
    if (gateErr) {
      console.error("consume_scan error", gateErr);
      return new Response(JSON.stringify({ error: "Could not verify scan quota" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (gate && (gate as any).allowed === false) {
      const g = gate as any;
      const msg =
        g.reason === "limit_reached"
          ? `You've used all ${g.limit} scans on the ${g.plan} plan this month. Upgrade or wait for next month's reset.`
          : "Scan not allowed.";
      return new Response(
        JSON.stringify({ error: msg, code: g.reason, plan: g.plan, used: g.used, limit: g.limit }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { resume, jobDescription, rewriteLevel = "balanced", title } = await req.json();
    if (!resume || !jobDescription) {
      return new Response(JSON.stringify({ error: "Resume and job description are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const levelGuidance: Record<string, string> = {
      light: "LIGHT POLISH: Make minimal edits — fix grammar, add 1-2 missing keywords, slight rephrasing only. Preserve original voice.",
      balanced: "BALANCED REWRITE: Rewrite bullets with strong action verbs and metrics, weave in JD keywords naturally.",
      aggressive: "AGGRESSIVE REWRITE: Heavily restructure bullets for maximum ATS match — assume metrics where reasonable, lead with JD keywords, transform weak bullets dramatically.",
    };
    const level = levelGuidance[rewriteLevel] ?? levelGuidance.balanced;

    const systemPrompt = `You are an expert ATS and resume optimization specialist. Analyze the resume against the job description and return structured tailoring advice as STRICT JSON. ${level} Be specific, actionable, and concise.
Return JSON with this schema:
{
  "ats_score": number (0-100),
  "company": string,
  "role": string,
  "missing_keywords": string[],
  "keyword_density": [{"keyword": string, "jd_count": number, "resume_count": number, "importance": "high"|"medium"|"low"}],
  "professional_summary": string,
  "improved_bullets": [{"original": string, "improved": string}],
  "skills_to_add": string[]
}`;

    const userPrompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nAnalyze the match and provide tailoring recommendations using the rewrite intensity above. Return JSON now.`;

    const aiResult = await callAi({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      model: "gemini-2.5-flash",
    });

    let analysis: any;
    try {
      analysis = JSON.parse(aiResult.content);
    } catch {
      throw new Error("AI returned invalid JSON analysis");
    }

    // Deterministic scoring engine — recomputes every time, so improved resumes raise the score.
    const scoring = computeAtsScore(resume, jobDescription);

    // Look up the user's previous score for the SAME job description (delta).
    const { data: prev } = await supabase
      .from("optimizations")
      .select("ats_score")
      .eq("user_id", userId)
      .eq("job_description", jobDescription)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const finalTitle =
      title?.trim() ||
      [analysis.company, analysis.role].filter(Boolean).join(" – ") ||
      `Tailored ${new Date().toLocaleDateString()}`;

    const { data: opt, error: insertErr } = await supabase
      .from("optimizations")
      .insert({
        user_id: userId,
        resume_text: resume,
        job_description: jobDescription,
        rewrite_level: rewriteLevel,
        title: finalTitle,
        company: analysis.company || null,
        role: analysis.role || null,
        ats_score: scoring.ats_score,
        previous_ats_score: prev?.ats_score ?? null,
        recruiter_score: scoring.recruiter_score,
        score_breakdown: scoring.breakdown,
        recommendations: scoring.recommendations,
        missing_keywords: analysis.missing_keywords || [],
        keyword_density: analysis.keyword_density || [],
        professional_summary: analysis.professional_summary || "",
        improved_bullets: analysis.improved_bullets || [],
        skills_to_add: analysis.skills_to_add || [],
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw insertErr;
    }

    return new Response(JSON.stringify({ optimization: opt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
