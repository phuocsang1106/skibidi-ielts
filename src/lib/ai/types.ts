import type { OperationalPlan } from "@/lib/ai/config";

export type AiPipelineContext = {
  logicalSubmissionId: string;
  userId: string;
  plan: OperationalPlan;
  features: string[];
  signal?: AbortSignal;
};

export type WritingInput = {
  questionText: string | null;
  essayText: string;
};

export type QuestionFile = {
  name: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  dataUrl: string;
};
