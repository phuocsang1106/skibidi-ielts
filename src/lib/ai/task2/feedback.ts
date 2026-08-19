import { callOpenRouterStructured } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { IELTS_RUBRIC_VERSION } from "@/lib/ai/rubric";
import { feedbackSchema, teachingAnalysisSchema, type ExaminerOutput } from "@/lib/ai/schemas";
import { feedbackRules, lockedScoresText } from "@/lib/ai/prompts";
import type { AiPipelineContext, WritingInput } from "@/lib/ai/types";

export async function teachingAnalysisTask2(ctx: AiPipelineContext, input: WritingInput, locked: ExaminerOutput) {
  const stage = "task2.teaching" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task2_teaching_analysis",
    schema: teachingAnalysisSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: "Analyze error and teaching patterns only. The verified scores are LOCKED. Do not output or propose any alternative band score." },
      { role: "user", content: `QUESTION:\n${input.questionText || ""}\n\nESSAY:\n${input.essayText}\n\nLOCKED VERIFIED CRITERIA:\n${lockedScoresText(locked)}` }
    ]
  });
}

export async function feedbackTask2(ctx: AiPipelineContext, input: WritingInput, locked: ExaminerOutput, teaching?: unknown) {
  const stage = "task2.feedback" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task2_feedback",
    schema: feedbackSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: feedbackRules(ctx.features) },
      { role: "user", content: `QUESTION:\n${input.questionText || ""}\n\nESSAY:\n${input.essayText}\n\nLOCKED VERIFIED CRITERIA:\n${lockedScoresText(locked)}\n\nTEACHING ANALYSIS:\n${teaching ? JSON.stringify(teaching) : "None"}` }
    ]
  });
}
