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

    const { url, optimizationId, company, role } = await req.json();

    let pageText = "";
    if (url) {
      try {
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ResumeShot/1.0" } });
        const html = await r.text();
        pageText = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);
      } catch (e) {
        console.warn("Fetch failed:", e);
      }
    }

    const startedAt = Date.now();
    const sysMsg = `You produce concise, structured company research briefs to help job applicants prepare. Return STRICT JSON only. If information is unknown, infer reasonably or omit.
Shape:
{
  "company_name": string,
  "summary": string,
  "mission": string,
  "recent_news": string[],
  "culture_values": string[],
  "interview_tips": string[],
  "talking_points": string[]
}`;

    const userMsg = `Company: ${company || "(infer from page)"}\nRole: ${
      role || "(infer)"
    }\n${url ? `Source URL: ${url}` : ""}\n\nPAGE CONTENT (may be partial):\n${
      pageText || "(no page content provided — use general knowledge)"
    }\n\nProduce the JSON brief now.`;

    const aiResult = await callAi({
      systemPrompt: sysMsg,
      userPrompt: userMsg,
      jsonMode: true,
      model: "gemini-2.5-flash",
    });

    let brief: any;
    try {
      brief = JSON.parse(aiResult.content);
    } catch {
      throw new Error("AI returned invalid JSON brief");
    }

    logAiUsage({
      userId: userData.user.id,
      feature: "company-brief",
      model: aiResult.model,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      tokenSource: "exact",
      durationMs: Date.now() - startedAt,
    });

    if (optimizationId) {
      await supabase
        .from("optimizations")
        .update({ company_brief: brief })
        .eq("id", optimizationId);
    }

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("company-brief error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
