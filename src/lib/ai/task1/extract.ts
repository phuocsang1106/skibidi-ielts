import { callOpenRouterStructured, type OpenRouterContentPart } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { markAiCallSemanticFailure } from "@/lib/ai/logging";
import { IELTS_RUBRIC_VERSION } from "@/lib/ai/rubric";
import { task1ExtractionSchema } from "@/lib/ai/schemas";
import { AppError } from "@/lib/errors";
import type { AiPipelineContext, QuestionFile } from "@/lib/ai/types";

function filePart(file: QuestionFile): OpenRouterContentPart {
  if (file.mimeType === "application/pdf") {
    return { type: "file", file: { filename: file.name, file_data: file.dataUrl } };
  }
  return { type: "image_url", image_url: { url: file.dataUrl } };
}

export async function extractTask1(ctx: AiPipelineContext, questionText: string | null, file: QuestionFile) {
  const stage = "task1.extract" as const;
  const model = modelForStage(ctx.plan, stage);
  const result = await callOpenRouterStructured({
    model,
    schemaName: "task1_question_extraction",
    schema: task1ExtractionSchema,
    signal: ctx.signal,
    pdfParser: file.mimeType === "application/pdf" ? "native" : undefined,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      {
        role: "system",
        content: `Inspect the actual IELTS Writing Task 1 visual/question directly. Extract only information you can read confidently. Never invent unreadable numbers. Identify labels, units, periods, categories, important figures, trends, comparisons, notable features and overview-relevant information. If important content cannot be read reliably, set readable=false and explain exactly why. A provider or file-format error is not the same as an unreadable question.`
      },
      { role: "user", content: [{ type: "text", text: `Optional typed question text:\n${questionText || "None"}` }, filePart(file)] }
    ]
  });
  if (!result.readable) {
    await markAiCallSemanticFailure(ctx.logicalSubmissionId, stage, "QUESTION_ACTUALLY_UNREADABLE", result.unreadableReason || "Task 1 question is unreadable.");
    throw new AppError("QUESTION_ACTUALLY_UNREADABLE", result.unreadableReason || "Task 1 question is unreadable.", 422, "We couldn't reliably read the important information in this question image. Please upload a clearer image. No Writing submission was deducted.");
  }
  return result;
}
