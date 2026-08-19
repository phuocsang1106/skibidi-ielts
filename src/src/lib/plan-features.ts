import { z } from "zod";
import type { PlanFeatures } from "@/types/feedback";

const schema = z.object({
  bandScore: z.boolean().default(true),
  criteria: z.boolean().default(true),
  errorCorrection: z.boolean().default(false),
  band7Sample: z.boolean().default(false),
  improvedEssay: z.boolean().default(false),
  nextBandGuidance: z.boolean().default(false)
});

export function parsePlanFeatures(value: unknown): PlanFeatures {
  return schema.parse(value ?? {});
}
