export type OpenRouterContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
      | { type: "file"; file: { filename: string; file_data: string } }
    >;

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: OpenRouterContent;
};

type JsonSchema = Record<string, unknown>;

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost?: number;
  };
  error?: { message?: string };
};

export type OpenRouterCallResult<T> = {
  data: T;
  usage?: OpenRouterResponse["usage"];
};

export async function callOpenRouterJson<T>({
  messages,
  schemaName,
  schema,
  temperature = 0,
  maxTokens = 5000,
}: {
  messages: OpenRouterMessage[];
  schemaName: string;
  schema: JsonSchema;
  temperature?: number;
  maxTokens?: number;
}): Promise<OpenRouterCallResult<T>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-3.7-flash";
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "https://skibidi-ielts.onrender.com",
      "X-Title": "Skibidi IELTS",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
      provider: { require_parameters: true },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const body = (await response.json()) as OpenRouterResponse;
  if (!response.ok) {
    throw new Error(body.error?.message || `OpenRouter failed with HTTP ${response.status}.`);
  }
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty response.");

  try {
    return { data: JSON.parse(content) as T, usage: body.usage };
  } catch {
    throw new Error("OpenRouter returned invalid JSON.");
  }
}

export function dataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
