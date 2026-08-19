import type { Plan, PlanAIConfig } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";

export type AiStage =
  | "task1.all-in-one"
  | "task1.extract"
  | "task1.examiner"
  | "task1.verifier"
  | "task1.feedback"
  | "task2.all-in-one"
  | "task2.examiner"
  | "task2.verifier"
  | "task2.verifier-feedback"
  | "task2.teaching"
  | "task2.feedback";

export type OperationalPlan = Plan & { aiConfig: PlanAIConfig | null };

function fallback(plan: OperationalPlan) {
  const model = plan.defaultModel || process.env.OPENROUTER_MODEL;
  if (!model) throw new AppError("AI_MODEL_NOT_CONFIGURED", "No AI model is configured.", 503, "AI grading is temporarily unavailable. No Writing submission was deducted.");
  return model;
}

export function modelForStage(plan: OperationalPlan, stage: AiStage) {
  const ai = plan.aiConfig;
  switch (stage) {
    case "task1.extract": return ai?.task1VisionModel || fallback(plan);
    case "task1.examiner": return ai?.task1ExaminerModel || fallback(plan);
    case "task1.verifier": return ai?.task1VerifierModel || fallback(plan);
    case "task1.feedback": return ai?.task1FeedbackModel || fallback(plan);
    case "task1.all-in-one": return ai?.task1VisionModel || ai?.task1ExaminerModel || fallback(plan);
    case "task2.examiner": return ai?.task2ExaminerModel || fallback(plan);
    case "task2.verifier":
    case "task2.verifier-feedback": return ai?.task2VerifierModel || fallback(plan);
    case "task2.teaching": return ai?.task2TeachingModel || ai?.task2FeedbackModel || fallback(plan);
    case "task2.feedback": return ai?.task2FeedbackModel || fallback(plan);
    case "task2.all-in-one": return ai?.task2ExaminerModel || fallback(plan);
  }
}

export function pipelineSize(plan: OperationalPlan) {
  const n = plan.aiRequestsPerSubmission;
  if (![1, 2, 3, 4].includes(n)) throw new AppError("INVALID_PIPELINE_CONFIG", `Unsupported pipeline size ${n}.`, 500, "AI grading is temporarily unavailable. No Writing submission was deducted.");
  return n as 1 | 2 | 3 | 4;
}
