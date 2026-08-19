import { callOpenRouterStructured } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { IELTS_RUBRIC_VERSION, rubricText } from "@/lib/ai/rubric";
import { verifierSchema, verifierFeedbackSchema, type ExaminerOutput, type Task1Extraction } from "@/lib/ai/schemas";
import { feedbackRules, TASK1_EXAMINER_RULES } from "@/lib/ai/prompts";
import type { AiPipelineContext, WritingInput } from "@/lib/ai/types";

const verifierRules = `Act as an independent IELTS Writing Task 1 verifier. Reassess each criterion independently against the official rubric and the normalized visual evidence. You may LOWER or RAISE the examiner's provisional band. Never preserve a score merely to agree. Do not invent chart values.`;

export async function verifyTask1(ctx: AiPipelineContext, input: WritingInput, extraction: Task1Extraction, examiner: ExaminerOutput) {
  const stage = "task1.verifier" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task1_verifier",
    schema: verifierSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: `${verifierRules}\n${TASK1_EXAMINER_RULES}\nOFFICIAL RUBRIC:\n${rubricText("task1")}` },
      { role: "user", content: `QUESTION EVIDENCE:\n${JSON.stringify(extraction)}\n\nQUESTION TEXT:\n${input.questionText || ""}\n\nESSAY:\n${input.essayText}\n\nPROVISIONAL EXAMINER:\n${JSON.stringify(examiner)}` }
    ]
  });
}

export async function verifyAndFeedbackTask1(ctx: AiPipelineContext, input: WritingInput, extraction: Task1Extraction, examiner: ExaminerOutput) {
  const stage = "task1.verifier" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task1_verifier_feedback",
    schema: verifierFeedbackSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: `${verifierRules}\n${TASK1_EXAMINER_RULES}\n${feedbackRules(ctx.features)}\nThe verified bands in this response are final. Generate feedback from them.\nOFFICIAL RUBRIC:\n${rubricText("task1")}` },
      { role: "user", content: `QUESTION EVIDENCE:\n${JSON.stringify(extraction)}\n\nQUESTION TEXT:\n${input.questionText || ""}\n\nESSAY:\n${input.essayText}\n\nPROVISIONAL EXAMINER:\n${JSON.stringify(examiner)}` }
    ]
  });
}
