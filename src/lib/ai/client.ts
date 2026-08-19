import { z } from "zod";
import { AppError } from "@/lib/errors";
import { logAiFailure, logAiSuccess, type AiLogContext } from "@/lib/ai/logging";

export type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export type OpenRouterMessage = { role: "system" | "user" | "assistant"; content: string | OpenRouterContentPart[] };

type CallOptions<T extends z.ZodType> = {
  model: string;
  messages: OpenRouterMessage[];
  schemaName: string;
  schema: T;
  log: Omit<AiLogContext, "model">;
  signal?: AbortSignal;
  timeoutMs?: number;
  pdfParser?: "native" | "cloudflare-ai" | "mistral-ocr";
};

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
  error?: { code?: number | string; message?: string };
};

function mergeSignals(external: AbortSignal | undefined, timeoutMs: number) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return external ? AbortSignal.any([external, timeout]) : timeout;
}

function responseText(data: OpenRouterResponse) {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part.text || "").join("");
  return "";
}

function categoryForStatus(status: number) {
  if (status === 408 || status === 504 || status === 524) return "TIMEOUT" as const;
  if ([401, 402, 403, 409, 429].includes(status) || status >= 500) return "PROVIDER_ERROR" as const;
  if (status >= 400 && status < 500) return "MODEL_ERROR" as const;
  return "PROVIDER_ERROR" as const;
}

export async function callOpenRouterStructured<T extends z.ZodType>(options: CallOptions<T>): Promise<z.infer<T>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  if (!apiKey) throw new AppError("OPENROUTER_NOT_CONFIGURED", "OPENROUTER_API_KEY is missing.", 503, "AI grading is temporarily unavailable. No Writing submission was deducted.");

  const startedAt = new Date();
  const log = { ...options.log, model: options.model };
  const maxAttempts = 3;
  let providerStatus: number | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(process.env.APP_URL ? { "HTTP-Referer": process.env.APP_URL } : {}),
          "X-Title": "Skibidi IELTS V2"
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: options.schemaName,
              strict: true,
              schema: z.toJSONSchema(options.schema, { target: "draft-07" })
            }
          },
          ...(options.pdfParser ? { plugins: [{ id: "file-parser", pdf: { engine: options.pdfParser } }] } : {})
        }),
        signal: mergeSignals(options.signal, options.timeoutMs ?? 90_000)
      });
      providerStatus = response.status;
      const raw = await response.text();
      let data: OpenRouterResponse;
      try {
        data = JSON.parse(raw) as OpenRouterResponse;
      } catch (error) {
        await logAiFailure(log, startedAt, providerStatus, "PROVIDER_ERROR", error, "INVALID_PROVIDER_JSON");
        throw new AppError("PROVIDER_BAD_RESPONSE", "OpenRouter returned invalid JSON.", 502, "AI grading is temporarily unavailable. No Writing submission was deducted.");
      }

      if (!response.ok || data.error) {
        const message = data.error?.message || `OpenRouter HTTP ${response.status}`;
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** (attempt - 1)));
          continue;
        }
        const category = categoryForStatus(response.status);
        await logAiFailure(log, startedAt, providerStatus, category, new Error(message), String(data.error?.code || response.status));
        throw new AppError("AI_PROVIDER_ERROR", message, 503, "AI grading is temporarily unavailable. No Writing submission was deducted.");
      }

      const content = responseText(data);
      let parsedJson: unknown;
      try { parsedJson = JSON.parse(content); } catch (error) {
        await logAiFailure(log, startedAt, providerStatus, "STRUCTURED_OUTPUT_ERROR", error);
        throw new AppError("AI_STRUCTURED_OUTPUT_ERROR", "AI output was not valid JSON.", 502, "AI grading could not be validated. No Writing submission was deducted.");
      }
      const parsed = options.schema.safeParse(parsedJson);
      if (!parsed.success) {
        await logAiFailure(log, startedAt, providerStatus, "STRUCTURED_OUTPUT_ERROR", parsed.error);
        throw new AppError("AI_STRUCTURED_OUTPUT_ERROR", "AI output failed schema validation.", 502, "AI grading could not be validated. No Writing submission was deducted.");
      }
      await logAiSuccess(log, startedAt, providerStatus, {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
        costUsd: data.usage?.cost
      });
      return parsed.data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      lastError = error;
      const aborted = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (!aborted && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** (attempt - 1)));
        continue;
      }
      await logAiFailure(log, startedAt, providerStatus, aborted ? "TIMEOUT" : "PROVIDER_ERROR", error);
      throw new AppError("AI_PROVIDER_ERROR", String(error), 503, "AI grading is temporarily unavailable. No Writing submission was deducted.");
    }
  }
  throw lastError;
}
