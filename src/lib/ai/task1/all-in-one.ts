import { callOpenRouterStructured, type OpenRouterContentPart } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { markAiCallSemanticFailure } from "@/lib/ai/logging";
import { IELTS_RUBRIC_VERSION, rubricText } from "@/lib/ai/rubric";
import { task1AllInOneSchema } from "@/lib/ai/schemas";
import { feedbackRules, TASK1_EXAMINER_RULES } from "@/lib/ai/prompts";
import { AppError } from "@/lib/errors";
import type { AiPipelineContext, QuestionFile, WritingInput } from "@/lib/ai/types";

function filePart(file: QuestionFile): OpenRouterContentPart {
  return file.mimeType === "application/pdf"
    ? { type: "file", file: { filename: file.name, file_data: file.dataUrl } }
    : { type: "image_url", image_url: { url: file.dataUrl } };
}

export async function allInOneTask1(ctx: AiPipelineContext, input: WritingInput, file: QuestionFile) {
  const stage = "task1.all-in-one" as const;
  const model = modelForStage(ctx.plan, stage);
  const result = await callOpenRouterStructured({
    model,
    schemaName: "task1_all_in_one",
    schema: task1AllInOneSchema,
    signal: ctx.signal,
    pdfParser: file.mimeType === "application/pdf" ? "native" : undefined,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      {
        role: "system",
        content: `Inspect the actual Task 1 image/PDF directly. Never invent unreadable figures. If key information is genuinely unreadable, set readable=false and do not fabricate grading evidence.\n${TASK1_EXAMINER_RULES}\n${feedbackRules(ctx.features)}\nOFFICIAL RUBRIC:\n${rubricText("task1")}`
      },
      { role: "user", content: [{ type: "text", text: `OPTIONAL QUESTION TEXT:\n${input.questionText || ""}\n\nLEARNER RESPONSE:\n${input.essayText}` }, filePart(file)] }
    ]
  });
  if (!result.readable) {
    await markAiCallSemanticFailure(ctx.logicalSubmissionId, stage, "QUESTION_ACTUALLY_UNREADABLE", result.unreadableReason || "Task 1 question is unreadable.");
    throw new AppError("QUESTION_ACTUALLY_UNREADABLE", result.unreadableReason || "Task 1 question unreadable.", 422, "We couldn't reliably read the important information in this question image. Please upload a clearer image. No Writing submission was deducted.");
  }
  return result;
}
