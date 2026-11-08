import { createServerFn } from "@tanstack/react-start";
import { generateChatCompletion, GatewayError } from "@lovable.dev/ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConsultStage = "assessment" | "details" | "medication" | "review";
export type ConsultUrgency = "emergency" | "urgent" | "routine" | "self-care";

export interface ConsultMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConsultTurn {
  reply: string;
  quickReplies: string[];
  stage: ConsultStage;
  emergency: boolean;
  readyForReport: boolean;
}

export interface ConsultReport {
  symptomsSummary: string;
  possibleExplanations: { title: string; explanation: string }[];
  urgency: ConsultUrgency;
  nextSteps: string[];
  whoToContact: { name: string; why: string };
  warningSigns: string[];
  summary: {
    mainComplaint: string;
    reportedSymptoms: string;
    medicalInfo: string;
    possibleExplanations: string;
    recommendedNextSteps: string;
  };
}

const chatTool = {
  type: "function" as const,
  function: {
    name: "consultation_response",
    description: "Return the next message in a health information consultation.",
    parameters: {
      type: "object",
      properties: {
        reply: {
          type: "string",
          description: "Your message to the patient. Ask at most ONE question. Warm, plain English, short sentences.",
        },
        quickReplies: {
          type: "array",
          items: { type: "string" },
          description: "0-4 short suggested answers the patient could tap (e.g. 'Yes', 'No', 'A few days ago'). Empty if free text is better.",
        },
        stage: {
          type: "string",
          enum: ["assessment", "details", "medication", "review"],
          description: "assessment = understanding main symptoms; details = history, severity, timing; medication = meds/conditions/allergies; review = wrapping up",
        },
        emergency: {
          type: "boolean",
          description: "true ONLY if the patient may be experiencing a life-threatening emergency (severe breathing difficulty, suspected heart attack, stroke signs, anaphylaxis, loss of consciousness, severe uncontrolled bleeding, etc.)",
        },
        readyForReport: {
          type: "boolean",
          description: "true when you have enough information to produce the final consultation report",
        },
      },
      required: ["reply", "quickReplies", "stage", "emergency", "readyForReport"],
    },
  },
};

const reportTool = {
  type: "function" as const,
  function: {
    name: "consultation_report",
    description: "Produce the final structured consultation report.",
    parameters: {
      type: "object",
      properties: {
        symptomsSummary: {
          type: "string",
          description: "What the patient reported, including when symptoms started and severity. Plain language.",
        },
        possibleExplanations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              explanation: { type: "string", description: "Why this may be relevant, in plain language" },
            },
            required: ["title", "explanation"],
          },
          description: "1-4 possibilities consistent with the symptoms. Possibilities, NOT diagnoses.",
        },
        urgency: {
          type: "string",
          enum: ["emergency", "urgent", "routine", "self-care"],
          description: "emergency = call 999; urgent = NHS 111 / same-day GP / urgent care; routine = GP appointment or pharmacist; self-care = monitor at home",
        },
        nextSteps: {
          type: "array",
          items: { type: "string" },
          description: "Clear, ordered actions the patient should take",
        },
        whoToContact: {
          type: "object",
          properties: {
            name: { type: "string", description: "e.g. 'NHS 111', 'Your GP', 'A community pharmacist', '999 / A&E'" },
            why: { type: "string" },
          },
          required: ["name", "why"],
        },
        warningSigns: {
          type: "array",
          items: { type: "string" },
          description: "Warning signs that should prompt more urgent medical attention",
        },
        summary: {
          type: "object",
          properties: {
            mainComplaint: { type: "string" },
            reportedSymptoms: { type: "string" },
            medicalInfo: { type: "string", description: "Relevant conditions, medications, allergies the patient mentioned" },
            possibleExplanations: { type: "string" },
            recommendedNextSteps: { type: "string" },
          },
          required: ["mainComplaint", "reportedSymptoms", "medicalInfo", "possibleExplanations", "recommendedNextSteps"],
        },
      },
      required: ["symptomsSummary", "possibleExplanations", "urgency", "nextSteps", "whoToContact", "warningSigns", "summary"],
    },
  },
};

const SYSTEM_PROMPT = `You are DoseAI, a health information and symptom assessment assistant inside the KnowDose medication education app (UK audience). You behave like a friendly, knowledgeable community pharmacist having a conversation — but you must NEVER claim to be a real pharmacist, doctor, or healthcare professional. You are an AI health information assistant.

HOW TO CONVERSE:
- Ask ONE question at a time. Never present a list of questions.
- Ask only questions relevant to what the patient has said. Do not run through a fixed questionnaire.
- Remember everything the patient has told you in this conversation. Never re-ask something they already answered.
- Depending on the situation, you may need to learn: what symptoms they have, when they started, whether they are getting better or worse, severity, exact location, other symptoms, whether this has happened before, existing medical conditions, current medications, allergies, recently started medications, age, and pregnancy/breastfeeding where relevant.
- Use warm, plain English. Short sentences. No jargon — or explain it simply. Phrases like "you may notice…" are good.
- Be calm and reassuring, but NEVER falsely reassure when serious symptoms have not been ruled out.

EMERGENCY DETECTION (HIGHEST PRIORITY):
- Before anything else, assess whether the patient may be experiencing a life-threatening emergency: severe difficulty breathing, suspected heart attack (e.g. crushing chest pain, pain spreading to arm or jaw), signs of stroke (face drooping, arm weakness, speech difficulty), severe allergic reaction or anaphylaxis, loss of consciousness, severe uncontrolled bleeding, or other potentially life-threatening symptoms.
- If an emergency is possible: set emergency=true, STOP the normal consultation, and your reply must tell them clearly to call 999 now (UK). Do not continue routine questions. Do not give reassurance that could delay emergency treatment.
- For urgent but non-life-threatening concerns, signpost to NHS 111, their GP, or an urgent care service.

MEDICATION AWARENESS:
- KnowDose is a medication education platform, so consider whether a recently started medication could be relevant, whether symptoms could be a possible side effect, and whether they should speak to a pharmacist about their medication.
- NEVER tell a patient to stop, start, increase or decrease a prescribed medication — always direct that to a professional.
- NEVER invent medication interactions, side effects, or dosing recommendations.

HARD LIMITS:
- Never claim to provide a confirmed diagnosis. Speak only of possibilities.
- Never prescribe medication or calculate or recommend personalised prescription doses.
- Never advise ignoring serious symptoms.
- Clearly communicate uncertainty. When information is insufficient, recommend professional assessment.
- Keep each reply under about 120 words.

When you have enough information (usually after 4-10 exchanges), set readyForReport=true and tell the patient you will now put together their consultation report.`;

const REPORT_PROMPT = `You are DoseAI producing the final consultation report from the conversation above. Base every section strictly on what the patient actually reported — do not invent symptoms, conditions, medications or probabilities. Possible explanations are possibilities, not confirmed diagnoses. The urgency must reflect the reported symptoms and any warning signs. Use plain, warm, professional English (UK). Never claim to be a healthcare professional. Never advise stopping, starting or changing prescribed medication.`;

const MAX_MESSAGES = 60;
const MAX_MSG_CHARS = 2000;

function sanitise(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[ --]/g, "").trim();
}

function validateMessages(raw: unknown, requireUserLast: boolean): ConsultMessage[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("messages must be a non-empty array");
  if (raw.length > MAX_MESSAGES) throw new Error(`Too many messages (max ${MAX_MESSAGES})`);
  const out: ConsultMessage[] = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      throw new Error("Each message needs role ('user' | 'assistant') and string content");
    }
    if (m.content.length > MAX_MSG_CHARS) throw new Error(`Message too long (max ${MAX_MSG_CHARS} characters)`);
    const content = sanitise(m.content);
    if (content) out.push({ role: m.role, content });
  }
  if (out.length === 0) throw new Error("Conversation is empty");
  if (requireUserLast && out[out.length - 1].role !== "user") {
    throw new Error("Conversation must end with a user message");
  }
  return out;
}

async function callGateway(messages: ConsultMessage[], mode: "chat" | "report") {
  const isReport = mode === "report";
  const resp = await generateChatCompletion({
    model: "google/gemini-3.8-flash",
    messages: [
      { role: "system", content: isReport ? REPORT_PROMPT : SYSTEM_PROMPT },
      ...messages,
      ...(isReport
        ? [{ role: "user" as const, content: "Please now produce my consultation report based on everything I've told you." }]
        : []),
    ],
    tools: [isReport ? reportTool : chatTool],
    tool_choice: { type: "function", function: { name: isReport ? "consultation_report" : "consultation_response" } },
  });
  const toolCall = resp.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") throw new Error("No structured response from AI");
  return JSON.parse(toolCall.function.arguments);
}

function handleError(e: unknown): never {
  if (e instanceof GatewayError) {
    console.error("consultation gateway error:", e.code, e.httpStatus, e.message);
    if (e.code === "rate_limited") throw new Error("Too many requests. Please wait a moment and try again.");
    if (e.code === "payment_required") throw new Error("The consultation service is temporarily unavailable. Please try again later.");
    throw new Error("The consultation service is temporarily unavailable. Please try again.");
  }
  throw e;
}

export const consultationTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { messages: unknown }) => data)
  .handler(async ({ data }): Promise<ConsultTurn> => {
    try {
      const messages = validateMessages(data.messages, true);
      const parsed = await callGateway(messages, "chat");
      return {
        reply: String(parsed.reply ?? ""),
        quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies.slice(0, 4).map(String) : [],
        stage: (["assessment", "details", "medication", "review"] as const).includes(parsed.stage) ? parsed.stage : "assessment",
        emergency: Boolean(parsed.emergency),
        readyForReport: Boolean(parsed.readyForReport),
      };
    } catch (e) {
      handleError(e);
    }
  });

export const consultationReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { messages: unknown }) => data)
  .handler(async ({ data }): Promise<ConsultReport> => {
    try {
      const messages = validateMessages(data.messages, false);
      const parsed = await callGateway(messages, "report");
      return parsed as ConsultReport;
    } catch (e) {
      handleError(e);
    }
  });
