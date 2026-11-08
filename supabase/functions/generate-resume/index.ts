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
    const sysMsg = `You are an expert executive resume writer and ATS optimization specialist.
Your mission is to polish the candidate's authentic resume so it ranks high in ATS screenings and impresses human recruiters, while remaining 100% TRUTHFUL, REALISTIC, AND GROUNDED in the candidate's actual history.

STRICT TRUTHFULNESS & ANTI-HALLUCINATION RULES (NON-NEGOTIABLE):
1. STRICT TITLE & COMPANY PRESERVATION:
   - You MUST keep every official job title, company name, organization, degree, institution, and date range EXACTLY as provided in the raw profile.
   - NEVER alter, rename, embellish, or fabricate a job title to match the target JD.
     * FORBIDDEN: Changing "Intern" to "Operations Intern" or "HR Intern" to "HR & Operations Intern" or "Graphic Design Intern" to "Communications & Operations Intern".
     * REQUIRED: Keep "Intern", "HR Intern", "Graphic Design Intern" exactly as provided. Official job titles must remain 100% authentic.

2. GROUNDED EXPERIENCE & NO FAKE DOMAINS:
   - NEVER invent responsibilities, tools, or domain-specific tasks that the candidate never performed.
   - If the candidate interned at TVS Motor Company (automotive manufacturing) or McDonald's (restaurant customer service) or Universal Tribes (HR) or Honourpoint (Graphic Design):
     * NEVER claim they performed banking operations, settlement & clearing, loan bookkeeping, credit underwriting, KYC/AML regulatory reporting, or treasury transactions.
     * Making such claims is fraudulent, causes the resume to look completely fake, and guarantees the candidate will fail any technical interview.

3. HOW TO TAILOR ETHICALLY VIA "TRANSFERABLE COMPETENCIES":
   - Tailor by highlighting genuine, transferable skills that hiring managers and ATS look for within the candidate's real work:
     * For automotive / manufacturing internship (e.g. TVS Motor): Highlight process observation, workflow documentation, operational efficiency analysis, and understanding departmental business processes.
     * For restaurant / customer service (e.g. McDonald's): Highlight customer inquiry handling, fast-paced service operations, self-order kiosk workflows, data collection via Google Forms, and survey analysis for service improvement.
     * For HR internship: Highlight onboarding coordination, documentation management, candidate tracking pipelines, process adherence, and stakeholder communication.
     * For Graphic Design: Highlight visual communications, stakeholder coordination, clear presentation of information, and project delivery.
     * For Founder/Project (e.g. ResumeShot.in): Highlight analytical thinking, product workflow design, algorithmic scoring, problem-solving, and tech initiative.
     * For Leadership & Contributions (Placement Committee, Class Representative, House Captain): Highlight team leadership, event coordination, client/student liaison, and proactive problem-solving.

4. BULLET POINT FORMULA:
   - Each bullet should follow: Strong Action Verb + Realistic Task/Context + Transferable Skill or Outcome.
   - 2-4 concise bullets per role. No fluff, no first-person pronouns ("I", "my").
   - Keep leadership, volunteer, club, and community roles in the "leadership" array.

5. SUMMARY:
   - 2-3 concise sentences. Grounded in the candidate's true academic & practical background (e.g., MBA/B.Com with cross-functional experience in operations, client service, and coordination), emphasizing strong quantitative, analytical, and problem-solving readiness for the target opportunity.

6. SKILLS SECTION INTEGRITY & CATEGORIZATION:
   - Do NOT dump 20+ arbitrary phrases copied from the JD into the skills list.
   - Preserve the candidate's real technical tools (e.g., MS Excel, PowerPoint, Word, Canva, Adobe Premiere Pro, Google Forms, etc.).
   - Group skills into 3-5 clean, logical categories (e.g., "Business & Operations", "Analytics & Office Tools", "Creative & Media", "Core Competencies").
   - Include genuine transferable skills relevant to the target role (e.g., Process Analysis, Client Service, Workflow Coordination, Documentation, Problem Solving).

7. OUTPUT SCHEMA:
Return ONLY valid JSON matching this exact structure:
{
 "name": string,
 "title": string,
 "email": string,
 "phone": string,
 "location": string,
 "links": [{"label": string, "url": string}],
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
