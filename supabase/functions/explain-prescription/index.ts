const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const explanationTool = {
  type: "function",
  function: {
    name: "return_explanation",
    description: "Return a clear, friendly explanation of a medication.",
    parameters: {
      type: "object",
      properties: {
        medications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Proper medication name" },
              overview: { type: "string", description: "1-2 sentences: what it is and what it does, in plain words" },
              whyPrescribed: { type: "string", description: "Likely reason it was prescribed, friendly tone" },
              howToTake: {
                type: "object",
                properties: {
                  timing: { type: "string" },
                  withFood: { type: "string" },
                  tips: { type: "array", items: { type: "string" } },
                },
                required: ["timing", "withFood", "tips"],
              },
              sideEffects: { type: "array", items: { type: "string" }, description: "3-5 most common, simple wording" },
              warnings: { type: "array", items: { type: "string" }, description: "Serious red-flag symptoms — 'seek help if...'" },
              missedDose: { type: "string" },
              lifestyle: {
                type: "object",
                properties: {
                  alcohol: { type: "string" },
                  driving: { type: "string" },
                  food: { type: "string" },
                },
                required: ["alcohol", "driving", "food"],
              },
              timeline: {
                type: "object",
                properties: {
                  startsWorking: { type: "string", description: "e.g. '30 minutes' or '1-2 weeks'" },
                  sideEffectsAppear: { type: "string", description: "e.g. 'first few days'" },
                },
                required: ["startsWorking", "sideEffectsAppear"],
              },
            },
            required: ["name", "overview", "whyPrescribed", "howToTake", "sideEffects", "warnings", "missedDose", "lifestyle", "timeline"],
          },
        },
      },
      required: ["medications"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input, simplify, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const systemPrompt = simplify
      ? `You are a friendly pharmacist explaining medication to a 12-year-old. Use very simple words, short sentences, warm tone. Avoid all medical jargon. Compare things to everyday life when helpful.`
      : `You are a warm, trustworthy pharmacist. Explain medications to young adults in clear, friendly, jargon-free language. Be reassuring, practical, and concise. When jargon is necessary, briefly explain it. Never sound clinical or robotic.`;

    const userContent: any[] = [];
    if (input) userContent.push({ type: "text", text: `Explain this prescription:\n\n${input}` });
    if (imageBase64) {
      userContent.push({ type: "text", text: "Read the prescription in this image and explain each medication." });
      userContent.push({ type: "image_url", image_url: { url: imageBase64 } });
    }
    if (userContent.length === 0) {
      return new Response(JSON.stringify({ error: "No input provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [explanationTool],
        tool_choice: { type: "function", function: { name: "return_explanation" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("Gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explain-prescription error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
