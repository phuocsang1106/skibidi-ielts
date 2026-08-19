import { callOpenRouterStructured } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { IELTS_RUBRIC_VERSION, rubricText } from "@/lib/ai/rubric";
import { examinerSchema } from "@/lib/ai/schemas";
import { TASK2_EXAMINER_RULES } from "@/lib/ai/prompts";
import type { AiPipelineContext, WritingInput } from "@/lib/ai/types";

export async function gradeTask2(ctx: AiPipelineContext, input: WritingInput) {
  const stage = "task2.examiner" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task2_examiner",
    schema: examinerSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: `${TASK2_EXAMINER_RULES}\nOFFICIAL RUBRIC:\n${rubricText("task2")}` },
      { role: "user", content: `QUESTION:\n${input.questionText || ""}\n\nLEARNER ESSAY:\n${input.essayText}` }
    ]
  });
}
