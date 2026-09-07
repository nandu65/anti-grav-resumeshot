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

    const { profile, targetJd = "" } = await req.json();
    if (!profile || typeof profile !== "object") {
      return new Response(JSON.stringify({ error: "profile required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = Date.now();
    const sysMsg = `You are an expert resume writer. Take the user's raw profile data and produce a polished, ATS-friendly resume as strict JSON.
Rules:
- Rewrite experience, leadership, and project descriptions as strong bullet points (action verb + task + quantified result when possible).
- 3-5 bullets per role. Concise, no fluff, no first-person.
- Keep leadership, volunteer, club, and community roles in the "leadership" array.
- Summary: 2-3 sentences, tailored to the target JD if provided.
- Skills: dedupe, group logically, keep concise.
- If a field is empty, return an empty string or empty array — never invent employers, dates, degrees, or metrics that weren't provided.
- Return ONLY valid JSON matching this shape:
{
 "name": string, "title": string, "email": string, "phone": string, "location": string, "links": [{"label": string, "url": string}],
 "summary": string,
 "experience": [{"company": string, "role": string, "location": string, "start": string, "end": string, "bullets": string[]}],
 "leadership": [{"organization": string, "role": string, "location": string, "start": string, "end": string, "bullets": string[]}],
 "education": [{"school": string, "degree": string, "location": string, "start": string, "end": string, "details": string}],
 "projects": [{"name": string, "tech": string, "bullets": string[]}],
 "skills": [{"category": string, "items": string[]}],
 "certifications": string[]
}`;
    const userMsg = `RAW PROFILE INPUT:\n${JSON.stringify(profile, null, 2)}\n\nTARGET JOB DESCRIPTION (optional, tailor tone/keywords if present):\n${targetJd || "(none)"}\n\nReturn the JSON now.`;

    const aiResult = await callAi({
      systemPrompt: sysMsg,
      userPrompt: userMsg,
      jsonMode: true,
      model: "gemini-2.5-flash",
    });

    let resume: any;
    try {
      resume = JSON.parse(aiResult.content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    logAiUsage({
      userId: userData.user.id,
      feature: "resume-builder",
      model: aiResult.model,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      tokenSource: "exact",
      durationMs: Date.now() - startedAt,
    });

    return new Response(JSON.stringify({ resume }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
