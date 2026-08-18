import { GeminiGradingProvider } from "@/lib/ai/gemini";

export function getGradingProvider() {
  return new GeminiGradingProvider();
}
