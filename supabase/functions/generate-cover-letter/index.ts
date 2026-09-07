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

    const { optimizationId, tone = "professional" } = await req.json();
    if (!optimizationId) {
      return new Response(JSON.stringify({ error: "optimizationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: opt, error: optErr } = await supabase
      .from("optimizations")
      .select("*")
      .eq("id", optimizationId)
      .maybeSingle();
    if (optErr || !opt) throw new Error("Optimization not found");

    const startedAt = Date.now();
    const sysMsg = `You write tailored cover letters that hiring managers love. Tone: ${tone}. Use 3-4 short paragraphs. Open with hook, body shows fit using specific resume points + JD keywords, close with confident call to action. Plain prose, no markdown, no placeholders like [Company].`;
    const userMsg = `RESUME:\n${opt.resume_text}\n\nJOB DESCRIPTION:\n${opt.job_description}\n\nCompany: ${
      opt.company || "the company"
    }\nRole: ${opt.role || "this role"}\n\nWrite the cover letter.`;

    const aiResult = await callAi({
      systemPrompt: sysMsg,
      userPrompt: userMsg,
      jsonMode: false,
      model: "gemini-2.5-flash",
    });

    const coverLetter = aiResult.content;
    if (!coverLetter) throw new Error("No cover letter returned");

    logAiUsage({
      userId: userData.user.id,
      feature: "cover-letter",
      model: aiResult.model,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      tokenSource: "exact",
      durationMs: Date.now() - startedAt,
    });

    await supabase
      .from("optimizations")
      .update({ cover_letter: coverLetter })
      .eq("id", optimizationId);

    return new Response(JSON.stringify({ coverLetter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cover-letter error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
