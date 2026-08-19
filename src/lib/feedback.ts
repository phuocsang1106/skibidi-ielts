import { z } from "zod";
import type { WritingFeedback } from "@/types/feedback";

const storedFeedbackSchema = z.object({
  overallBand: z.number(),
  summary: z.string(),
  criteria: z.array(z.object({
    name: z.string(),
    band: z.number(),
    explanation: z.string(),
    mistakes: z.array(z.string()),
    correction: z.string()
  })),
  errorCorrection: z.array(z.object({ original: z.string(), corrected: z.string(), explanation: z.string() })).optional(),
  band7Sample: z.string().optional(),
  improvedEssay: z.string().optional(),
  nextBandGuidance: z.array(z.string()).optional()
});

export function parseStoredFeedback(value: unknown): WritingFeedback | null {
  const parsed = storedFeedbackSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
