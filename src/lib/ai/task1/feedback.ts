import { callOpenRouterStructured } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { IELTS_RUBRIC_VERSION } from "@/lib/ai/rubric";
import { feedbackSchema, type ExaminerOutput, type Task1Extraction } from "@/lib/ai/schemas";
import { feedbackRules, lockedScoresText } from "@/lib/ai/prompts";
import type { AiPipelineContext, WritingInput } from "@/lib/ai/types";

export async function feedbackTask1(ctx: AiPipelineContext, input: WritingInput, extraction: Task1Extraction, locked: ExaminerOutput) {
  const stage = "task1.feedback" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task1_feedback",
    schema: feedbackSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: feedbackRules(ctx.features) },
      { role: "user", content: `QUESTION EVIDENCE:\n${JSON.stringify(extraction)}\n\nQUESTION TEXT:\n${input.questionText || ""}\n\nESSAY:\n${input.essayText}\n\nLOCKED VERIFIED CRITERIA:\n${lockedScoresText(locked)}` }
    ]
  });
}
