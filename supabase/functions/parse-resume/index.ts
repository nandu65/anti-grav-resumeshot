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

    const { text = "" } = await req.json();
    const trimmed = String(text).slice(0, 30000);
    if (!trimmed.trim()) {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startedAt = Date.now();
    const sysMsg = `You extract structured resume data from raw resume text. Return STRICT JSON only.
Rules:
- Preserve the user's own wording for bullets and summary — do NOT rewrite or invent content.
- If a field isn't present, use "" or [].
- Split multi-line responsibilities into separate bullet strings.
- STRICT LEADERSHIP SEPARATION:
  1. Any entries under sections named "Leadership", "Leadership Experience", "Volunteer Experience", "Volunteering", "Positions of Responsibility", "Activities", "Extracurriculars", or club/community roles MUST go into the "leadership" array, NEVER in "experience".
  2. CRITICAL: Even if an entry is listed under "WORK EXPERIENCE" or "EXPERIENCE" in the raw resume, if the role or organization represents a student leadership role, club, committee, representative, band, house captain, or volunteer role (e.g. "Placement Coordinator", "Volunteer", "Class Representative", "School Band", "Captain / House Captain", "President", "Secretary", "Student Council", "NSS", "NCC", "NGO Volunteer"), you MUST EXTRACT IT OUT of "experience" and place it into the "leadership" array!
  3. "experience" must ONLY contain formal professional employment, jobs, corporate internships, or freelancing.
- Shape:
{
 "name": string, "title": string, "email": string, "phone": string, "location": string,
 "linkedin": string, "github": string, "portfolio": string,
 "summary": string,
 "experience": [{"company": string, "role": string, "location": string, "start": string, "end": string, "bullets": string[]}],
 "leadership": [{"organization": string, "role": string, "location": string, "start": string, "end": string, "bullets": string[]}],
 "education": [{"school": string, "degree": string, "location": string, "start": string, "end": string, "details": string}],
 "projects": [{"name": string, "tech": string, "bullets": string[]}],
 "skills": string[],
 "certifications": string[]
}`;

    const userMsg = `RAW RESUME TEXT:\n${trimmed}\n\nReturn the JSON now.`;

    const aiResult = await callAi({
      systemPrompt: sysMsg,
      userPrompt: userMsg,
      jsonMode: true,
      model: "gemini-2.5-flash",
    });

    let parsed: any;
    try {
      parsed = JSON.parse(aiResult.content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    logAiUsage({
      userId: userData.user.id,
      feature: "resume-parse",
      model: aiResult.model,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      tokenSource: "exact",
      durationMs: Date.now() - startedAt,
    });

    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
