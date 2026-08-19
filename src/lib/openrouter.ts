import { z } from "zod";
import type { PlanFeatures, WritingFeedback } from "@/types/feedback";
import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const optionalArray = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((value) => value === null ? undefined : value, z.array(schema).optional());
const optionalString = z.preprocess((value) => value === null ? undefined : value, z.string().optional());

const feedbackSchema = z.object({
  overallBand: z.number().min(0).max(9),
  summary: z.string(),
  criteria: z.array(z.object({
    name: z.string(),
    band: z.number().min(0).max(9),
    explanation: z.string(),
    mistakes: z.array(z.string()),
    correction: z.string()
  })).length(4),
  errorCorrection: optionalArray(z.object({
    original: z.string(),
    corrected: z.string(),
    explanation: z.string()
  })),
  band7Sample: optionalString,
  improvedEssay: optionalString,
  nextBandGuidance: optionalArray(z.string())
});

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });
const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallBand: { type: "number", minimum: 0, maximum: 9 },
    summary: { type: "string" },
    criteria: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          band: { type: "number", minimum: 0, maximum: 9 },
          explanation: { type: "string" },
          mistakes: { type: "array", items: { type: "string" } },
          correction: { type: "string" }
        },
        required: ["name", "band", "explanation", "mistakes", "correction"]
      }
    },
    errorCorrection: nullable({
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          explanation: { type: "string" }
        },
        required: ["original", "corrected", "explanation"]
      }
    }),
    band7Sample: nullable({ type: "string" }),
    improvedEssay: nullable({ type: "string" }),
    nextBandGuidance: nullable({ type: "array", items: { type: "string" } })
  },
  required: ["overallBand", "summary", "criteria", "errorCorrection", "band7Sample", "improvedEssay", "nextBandGuidance"]
};

type OpenRouterPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

type GradeInput = {
  taskType: "TASK_1" | "TASK_2";
  taskPrompt?: string;
  responseText: string;
  taskFile?: { name: string; type: string; dataUrl: string };
  features: PlanFeatures;
  model: string;
};

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function buildPrompt(input: GradeInput) {
  const enabled = Object.entries(input.features).filter(([, value]) => value).map(([key]) => key).join(", ");
  const firstCriterion = input.taskType === "TASK_1" ? "Task Achievement" : "Task Response";
  const taskSource = input.taskPrompt?.trim()
    ? `IELTS task/question:\n${input.taskPrompt.trim()}`
    : "The IELTS task/question is supplied in the attached image or PDF. Treat the attachment as the QUESTION/CHART only, not as the candidate response.";

  return `You are a strict, evidence-based IELTS Writing examiner. Grade the candidate response for ${input.taskType === "TASK_1" ? "IELTS Writing Task 1" : "IELTS Writing Task 2"} using official-style band descriptors.

${taskSource}

Candidate response:\n${input.responseText}

Return exactly four criteria in this exact order and keep the criterion names in English for stable UI mapping:
1. ${firstCriterion}
2. Coherence and Cohesion
3. Lexical Resource
4. Grammatical Range and Accuracy

LANGUAGE RULES — IMPORTANT:
- All examiner commentary must be in natural Vietnamese: summary, criterion explanation, mistakes, criterion correction/guidance, errorCorrection.explanation, and nextBandGuidance.
- When pointing out a mistake, quote the relevant English phrase/sentence from the essay, then explain the issue in Vietnamese.
- errorCorrection.original and errorCorrection.corrected must stay in English.
- band7Sample and improvedEssay are IELTS sample/rewritten essays, so they must stay in English.
- Do not translate the candidate's essay into Vietnamese.

Use half-band increments where appropriate. Base every score on evidence from the submitted task and essay. Do not reward ideas or language that are not present. For Task 1, check whether the response actually covers the visual/task information visible in the attachment or prompt.

Enabled feature flags: ${enabled}. The premium fields are errorCorrection, band7Sample, improvedEssay, nextBandGuidance. Return each premium field only when its corresponding feature is enabled; when the schema requires every key, return null for disabled premium fields.

Return JSON only.`;
}

export async function resolveOpenRouterApiKey() {
  const setting = await prisma.aISetting.findUnique({ where: { id: "default" } });
  if (setting?.encryptedApiKey) return decryptSecret(setting.encryptedApiKey);
  const envKey = process.env.OPENROUTER_API_KEY;
  if (!envKey) throw new Error("OpenRouter API key is not configured.");
  return envKey;
}

async function requestOpenRouter(apiKey: string, body: Record<string, unknown>) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME ?? "Skibidi IELTS"
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000)
  });
  const payload = (await response.json().catch(() => null)) as OpenRouterResponse | null;
  return { response, payload };
}

export async function gradeWriting(input: GradeInput): Promise<WritingFeedback> {
  const content: OpenRouterPart[] = [{ type: "text", text: buildPrompt(input) }];
  if (input.taskFile) {
    if (input.taskFile.type === "application/pdf") {
      content.push({ type: "file", file: { filename: input.taskFile.name, file_data: input.taskFile.dataUrl } });
    } else {
      content.push({ type: "image_url", image_url: { url: input.taskFile.dataUrl } });
    }
  }

  const apiKey = await resolveOpenRouterApiKey();
  const baseBody = {
    model: input.model,
    messages: [
      { role: "system", content: "Return accurate IELTS assessment as JSON only. Examiner feedback must be in Vietnamese; English corrections and sample essays remain in English. Never invent content that is not visible in the supplied task or essay." },
      { role: "user", content }
    ],
    temperature: 0.2
  };

  let result = await requestOpenRouter(apiKey, {
    ...baseBody,
    response_format: {
      type: "json_schema",
      json_schema: { name: "ielts_writing_feedback", strict: true, schema: jsonSchema }
    },
    provider: { require_parameters: true },
    plugins: [{ id: "response-healing" }]
  });

  if (!result.response.ok && [400, 404, 422].includes(result.response.status)) {
    result = await requestOpenRouter(apiKey, baseBody);
  }

  if (!result.response.ok) {
    throw new Error(result.payload?.error?.message ?? `OpenRouter request failed with status ${result.response.status}.`);
  }

  const raw = result.payload?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenRouter returned an empty response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (!fenced) throw new Error("AI response was not valid JSON.");
    parsed = JSON.parse(fenced);
  }

  return feedbackSchema.parse(parsed);
}
