import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAiUsage } from "../_shared/aiUsage.ts";
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { optimizationId } = await req.json();
    if (!optimizationId) {
      return new Response(JSON.stringify({ error: "optimizationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: opt } = await supabase
      .from("optimizations")
      .select("*")
      .eq("id", optimizationId)
      .maybeSingle();
    if (!opt) throw new Error("Optimization not found");

    const startedAt = Date.now();
    const sysMsg = `You are a career coach. Identify skill gaps between a resume and a target role, and recommend SPECIFIC, real, well-known courses, certifications, or learning resources. Return STRICT JSON only.
Shape:
{
  "gaps": [
    {
      "skill": string,
      "priority": "critical" | "important" | "nice-to-have",
      "why": string,
      "estimated_hours": number,
      "resources": [
        {
          "title": string,
          "provider": string,
          "type": "course" | "certification" | "project" | "book",
          "url": string,
          "cost": "free" | "paid"
        }
      ]
    }
  ],
  "top_priority": string,
  "summary": string
}`;

    const userMsg = `RESUME:\n${opt.resume_text}\n\nJOB DESCRIPTION:\n${
      opt.job_description
    }\n\nMissing keywords from prior analysis: ${(opt.missing_keywords || []).join(
      ", "
    )}\n\nIdentify skill gaps and recommend learning paths. Return JSON now.`;

    const aiResult = await callAi({
      systemPrompt: sysMsg,
      userPrompt: userMsg,
      jsonMode: true,
      model: "gemini-2.5-flash",
    });

    let result: any;
    try {
      result = JSON.parse(aiResult.content);
    } catch {
      throw new Error("AI returned invalid JSON for skill gaps");
    }

    logAiUsage({
      userId: userData.user.id,
      feature: "skill-gap",
      model: aiResult.model,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      tokenSource: "exact",
      durationMs: Date.now() - startedAt,
    });

    const gaps = result.gaps || [];
    await supabase.from("optimizations").update({ skill_gaps: gaps }).eq("id", optimizationId);

    return new Response(JSON.stringify({ gaps, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("skill-gap error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
