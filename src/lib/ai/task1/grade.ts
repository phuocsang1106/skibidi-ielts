import { callOpenRouterStructured } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { IELTS_RUBRIC_VERSION, rubricText } from "@/lib/ai/rubric";
import { examinerSchema, gradeFeedbackSchema, type Task1Extraction } from "@/lib/ai/schemas";
import { feedbackRules, TASK1_EXAMINER_RULES } from "@/lib/ai/prompts";
import type { AiPipelineContext, WritingInput } from "@/lib/ai/types";

export async function gradeTask1(ctx: AiPipelineContext, input: WritingInput, extraction: Task1Extraction) {
  const stage = "task1.examiner" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task1_examiner",
    schema: examinerSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: `${TASK1_EXAMINER_RULES}\nOFFICIAL RUBRIC:\n${rubricText("task1")}` },
      { role: "user", content: `NORMALIZED QUESTION EVIDENCE:\n${JSON.stringify(extraction)}\n\nOPTIONAL QUESTION TEXT:\n${input.questionText || ""}\n\nLEARNER RESPONSE:\n${input.essayText}` }
    ]
  });
}

export async function gradeAndFeedbackTask1(ctx: AiPipelineContext, input: WritingInput, extraction: Task1Extraction) {
  const stage = "task1.examiner" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task1_grade_feedback",
    schema: gradeFeedbackSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: `${TASK1_EXAMINER_RULES}\n${feedbackRules(ctx.features)}\nOFFICIAL RUBRIC:\n${rubricText("task1")}` },
      { role: "user", content: `NORMALIZED QUESTION EVIDENCE:\n${JSON.stringify(extraction)}\n\nQUESTION TEXT:\n${input.questionText || ""}\n\nLEARNER RESPONSE:\n${input.essayText}` }
    ]
  });
}
