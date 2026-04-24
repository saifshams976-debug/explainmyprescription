const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const compareTool = {
  type: "function",
  function: {
    name: "return_comparison",
    description: "Return a friendly comparison of multiple medications.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "1-3 sentence plain-English overview of taking these together" },
        interactions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["low", "moderate", "high"] },
              medications: { type: "array", items: { type: "string" } },
              description: { type: "string", description: "Plain-language explanation" },
            },
            required: ["severity", "medications", "description"],
          },
        },
        combinedSideEffects: {
          type: "array",
          items: { type: "string" },
          description: "Side effects more likely when taken together",
        },
        safetyTips: {
          type: "array",
          items: { type: "string" },
          description: "Practical, friendly safety advice",
        },
      },
      required: ["summary", "interactions", "combinedSideEffects", "safetyTips"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Cap raw request body
    const MAX_BODY_BYTES = 64 * 1024; // 64KB is plenty for a list of names
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength && contentLength > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "Request too large" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "Request too large" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsedBody: any;
    try { parsedBody = JSON.parse(rawBody); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { medications } = parsedBody ?? {};
    const MAX_MEDS = 10;
    const MAX_NAME_CHARS = 200;
    if (!Array.isArray(medications) || medications.length < 2) {
      return new Response(JSON.stringify({ error: "Provide at least 2 medications" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (medications.length > MAX_MEDS) {
      return new Response(JSON.stringify({ error: `Too many medications (max ${MAX_MEDS})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const safeMeds: string[] = [];
    for (const m of medications) {
      if (typeof m !== "string") {
        return new Response(JSON.stringify({ error: "Each medication must be a string" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const cleaned = m.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();
      if (!cleaned) {
        return new Response(JSON.stringify({ error: "Medication names cannot be empty" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (cleaned.length > MAX_NAME_CHARS) {
        return new Response(JSON.stringify({ error: `Medication name too long (max ${MAX_NAME_CHARS} characters)` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      safeMeds.push(cleaned);
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const systemPrompt = `You are a friendly UK pharmacist explaining how multiple medications interact, in very simple, calm language.

Rules:
- Use British English spelling
- Be reassuring, not alarmist — but flag genuine risks clearly
- Avoid jargon (or explain it simply)
- Keep sentences short

For each pair (or combination) of medications that genuinely interact, add an entry to "interactions" with:
- severity: "low" (usually fine, just be aware), "moderate" (talk to your pharmacist), "high" (speak to your doctor before combining)
- medications: the names involved
- description: what could happen and what to do, in plain English

Only include interactions that are clinically meaningful. If there are no real interactions, return an empty interactions array and say so warmly in the summary.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Compare these medications a patient is taking together:\n\n${safeMeds.map((m: string, i: number) => `${i + 1}. ${m}`).join("\n")}` },
        ],
        tools: [compareTool],
        tool_choice: { type: "function", function: { name: "return_comparison" } },
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
    console.error("compare-medications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
