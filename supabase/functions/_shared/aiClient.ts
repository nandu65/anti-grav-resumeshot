// Universal AI client that automatically uses GEMINI_API_KEY (direct Google API)
// or LOVABLE_API_KEY (Lovable AI Gateway).

export interface AiCallOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  responseSchema?: any;
  model?: string;
}

export interface AiCallResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export async function callAi({
  systemPrompt,
  userPrompt,
  jsonMode = true,
  responseSchema,
  model = "gemini-2.5-flash",
}: AiCallOptions): Promise<AiCallResult> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
    throw new Error(
      "AI API Key is not configured. Please set GEMINI_API_KEY or LOVABLE_API_KEY in your Supabase project secrets."
    );
  }

  // 1. If GEMINI_API_KEY is available, use official Google Generative Language API
  if (GEMINI_API_KEY) {
    const cleanModel = model.replace(/^google\//, "");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${GEMINI_API_KEY}`;

    const body: any = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: jsonMode ? "application/json" : "text/plain",
      },
    };

    if (responseSchema && jsonMode) {
      body.generationConfig.responseSchema = responseSchema;
    }

    const resp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.warn(`Gemini API (${cleanModel}) error: ${resp.status}`, errText);

      // Fallback model retry if 404
      if (resp.status === 404 && cleanModel !== "gemini-1.5-flash") {
        return callAi({
          systemPrompt,
          userPrompt,
          jsonMode,
          responseSchema,
          model: "gemini-1.5-flash",
        });
      }
      throw new Error(`Gemini API error (${resp.status}): ${errText || "Request failed"}`);
    }

    const data = await resp.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const usage = data.usageMetadata || {};
    const inputTokens =
      usage.promptTokenCount ?? Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    const outputTokens = usage.candidatesTokenCount ?? Math.ceil(content.length / 4);

    return { content, inputTokens, outputTokens, model: cleanModel };
  }

  // 2. Otherwise use Lovable AI Gateway
  const gatewayModel = model.startsWith("google/") ? model : `google/${model}`;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: gatewayModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    console.error("AI gateway error:", resp.status, errText);
    throw new Error(`AI Gateway error (${resp.status}): ${errText || "Request failed"}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  const usage = data.usage || {};
  const inputTokens =
    usage.prompt_tokens ?? Math.ceil((systemPrompt.length + userPrompt.length) / 4);
  const outputTokens = usage.completion_tokens ?? Math.ceil(content.length / 4);

  return { content, inputTokens, outputTokens, model: gatewayModel };
}
