import { callOpenRouterStructured } from "@/lib/ai/client";
import { modelForStage, pipelineSize } from "@/lib/ai/config";
import { IELTS_RUBRIC_VERSION, rubricText } from "@/lib/ai/rubric";
import { verifierSchema, verifierFeedbackSchema, type ExaminerOutput } from "@/lib/ai/schemas";
import { feedbackRules, TASK2_EXAMINER_RULES } from "@/lib/ai/prompts";
import type { AiPipelineContext, WritingInput } from "@/lib/ai/types";

const verifierRules = `Act as an independent IELTS verifier. Reassess each criterion independently against the official rubric and the actual essay. You may LOWER or RAISE the examiner's provisional band. Do not preserve a score merely to agree. Return final criterion bands and precise reasons for every change.`;

export async function verifyTask2(ctx: AiPipelineContext, input: WritingInput, examiner: ExaminerOutput) {
  const stage = "task2.verifier" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task2_verifier",
    schema: verifierSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: `${verifierRules}\n${TASK2_EXAMINER_RULES}\nOFFICIAL RUBRIC:\n${rubricText("task2")}` },
      { role: "user", content: `QUESTION:\n${input.questionText || ""}\n\nESSAY:\n${input.essayText}\n\nPROVISIONAL EXAMINER OUTPUT:\n${JSON.stringify(examiner)}` }
    ]
  });
}

export async function verifyAndFeedbackTask2(ctx: AiPipelineContext, input: WritingInput, examiner: ExaminerOutput) {
  const stage = "task2.verifier-feedback" as const;
  const model = modelForStage(ctx.plan, stage);
  return callOpenRouterStructured({
    model,
    schemaName: "task2_verifier_feedback",
    schema: verifierFeedbackSchema,
    signal: ctx.signal,
    log: { logicalSubmissionId: ctx.logicalSubmissionId, userId: ctx.userId, planId: ctx.plan.id, stage, pipelineSize: pipelineSize(ctx.plan), rubricVersion: IELTS_RUBRIC_VERSION },
    messages: [
      { role: "system", content: `${verifierRules}\n${TASK2_EXAMINER_RULES}\n${feedbackRules(ctx.features)}\nThe scores you verify in this response are final. Generate feedback from those final scores.\nOFFICIAL RUBRIC:\n${rubricText("task2")}` },
      { role: "user", content: `QUESTION:\n${input.questionText || ""}\n\nESSAY:\n${input.essayText}\n\nPROVISIONAL EXAMINER OUTPUT:\n${JSON.stringify(examiner)}` }
    ]
  });
}
