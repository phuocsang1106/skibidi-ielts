import { pipelineSize } from "@/lib/ai/config";
import { applyVerifiedBands, finalResult } from "@/lib/ai/helpers";
import type { FinalGradingResult } from "@/lib/ai/schemas";
import type { AiPipelineContext, QuestionFile, WritingInput } from "@/lib/ai/types";
import { allInOneTask1 } from "@/lib/ai/task1/all-in-one";
import { extractTask1 } from "@/lib/ai/task1/extract";
import { gradeAndFeedbackTask1, gradeTask1 } from "@/lib/ai/task1/grade";
import { verifyAndFeedbackTask1, verifyTask1 } from "@/lib/ai/task1/verify";
import { feedbackTask1 } from "@/lib/ai/task1/feedback";
import { allInOneTask2 } from "@/lib/ai/task2/all-in-one";
import { gradeTask2 } from "@/lib/ai/task2/grade";
import { verifyAndFeedbackTask2, verifyTask2 } from "@/lib/ai/task2/verify";
import { feedbackTask2, teachingAnalysisTask2 } from "@/lib/ai/task2/feedback";

export async function runTask2Pipeline(ctx: AiPipelineContext, input: WritingInput): Promise<FinalGradingResult> {
  const size = pipelineSize(ctx.plan);
  if (size === 1) {
    const output = await allInOneTask2(ctx, input);
    return finalResult({ criteria: output.criteria, examinerNotes: output.examinerNotes }, output.feedback, null);
  }

  const provisional = await gradeTask2(ctx, input);
  if (size === 2) {
    const combined = await verifyAndFeedbackTask2(ctx, input, provisional);
    const verifier = { finalBands: combined.finalBands, changes: combined.changes, verificationSummary: combined.verificationSummary };
    const locked = applyVerifiedBands(provisional, verifier);
    return finalResult(locked, combined.feedback, verifier);
  }

  const verifier = await verifyTask2(ctx, input, provisional);
  const locked = applyVerifiedBands(provisional, verifier);
  if (size === 3) {
    const feedback = await feedbackTask2(ctx, input, locked);
    return finalResult(locked, feedback, verifier);
  }

  const teaching = await teachingAnalysisTask2(ctx, input, locked);
  const feedback = await feedbackTask2(ctx, input, locked, teaching);
  return finalResult(locked, feedback, verifier);
}

export async function runTask1Pipeline(ctx: AiPipelineContext, input: WritingInput, file: QuestionFile): Promise<FinalGradingResult> {
  const size = pipelineSize(ctx.plan);
  if (size === 1) {
    const output = await allInOneTask1(ctx, input, file);
    const examiner = output.grading;
    return { ...finalResult(examiner, output.feedback, null), normalizedQuestion: {
      readable: output.readable,
      confidence: output.confidence,
      unreadableReason: output.unreadableReason,
      questionType: output.questionType,
      promptText: output.promptText,
      visibleLabels: output.visibleLabels,
      units: output.units,
      timePeriods: output.timePeriods,
      categories: output.categories,
      importantFigures: output.importantFigures,
      trends: output.trends,
      comparisons: output.comparisons,
      notableFeatures: output.notableFeatures,
      overviewRelevantInformation: output.overviewRelevantInformation
    } };
  }

  const extraction = await extractTask1(ctx, input.questionText, file);
  if (size === 2) {
    const output = await gradeAndFeedbackTask1(ctx, input, extraction);
    const examiner = { criteria: output.criteria, examinerNotes: output.examinerNotes };
    return { ...finalResult(examiner, output.feedback, null), normalizedQuestion: extraction };
  }

  const provisional = await gradeTask1(ctx, input, extraction);
  if (size === 3) {
    const combined = await verifyAndFeedbackTask1(ctx, input, extraction, provisional);
    const verifier = { finalBands: combined.finalBands, changes: combined.changes, verificationSummary: combined.verificationSummary };
    const locked = applyVerifiedBands(provisional, verifier);
    return { ...finalResult(locked, combined.feedback, verifier), normalizedQuestion: extraction };
  }

  const verifier = await verifyTask1(ctx, input, extraction, provisional);
  const locked = applyVerifiedBands(provisional, verifier);
  const feedback = await feedbackTask1(ctx, input, extraction, locked);
  return { ...finalResult(locked, feedback, verifier), normalizedQuestion: extraction };
}
