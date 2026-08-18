import { prisma } from "@/lib/db/prisma";
import { getGradingProvider } from "@/lib/ai";
import { finalWritingResultSchema, type FinalWritingResult } from "@/lib/ai/schemas";
import { prepareUpload, extractLocalWritingText, UploadValidationError, type PreparedFile } from "@/lib/files/uploads";
import {
  consumeWritingReservation,
  QuotaExhaustedError,
  releaseWritingReservation,
  reserveWritingQuota
} from "@/lib/entitlements/service";
import { consumeGradingAttempt, WritingRateLimitedError } from "@/lib/writing/rate-limit";
import { overallBand, roundBand } from "@/lib/writing/bands";

export type WritingRequestInput = {
  taskType: "TASK_1" | "TASK_2";
  questionText?: string;
  essayText?: string;
  questionFile?: File;
  writingFile?: File;
};

export class WritingInputError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

async function prepareInput(input: WritingRequestInput) {
  const questionText = input.questionText?.trim() || "";
  const essayText = input.essayText?.trim() || "";
  let questionFile: PreparedFile | undefined;
  let writingFile: PreparedFile | undefined;
  let localEssayText = essayText;

  if (input.questionFile && input.questionFile.size > 0) questionFile = await prepareUpload(input.questionFile, "question");
  if (input.writingFile && input.writingFile.size > 0) writingFile = await prepareUpload(input.writingFile, "writing");

  if (input.taskType === "TASK_1" && !questionFile) {
    throw new WritingInputError("QUESTION_REQUIRED", "Task 1 requires a question image or PDF.");
  }
  if (input.taskType === "TASK_2" && !questionText && !questionFile) {
    throw new WritingInputError("QUESTION_REQUIRED", "Enter the Task 2 question or upload it.");
  }
  if (essayText && writingFile) {
    throw new WritingInputError("MULTIPLE_ESSAYS", "Use either the essay editor or a Writing file, not both.");
  }
  if (!essayText && !writingFile) {
    throw new WritingInputError("ESSAY_REQUIRED", "Enter your essay or upload a Writing file.");
  }

  if (writingFile) {
    const extracted = await extractLocalWritingText(writingFile);
    if (extracted !== null) {
      localEssayText = extracted;
      writingFile = undefined;
    }
  }
  if (localEssayText && localEssayText.split(/\s+/).filter(Boolean).length < 10) {
    throw new WritingInputError("ESSAY_TOO_SHORT", "The Writing response is too short to evaluate reliably.");
  }

  return { questionText, essayText: localEssayText, questionFile, writingFile };
}

export async function gradeWriting(userId: string, input: WritingRequestInput) {
  const prepared = await prepareInput(input);
  await consumeGradingAttempt(userId);

  const submission = await prisma.writingSubmission.create({
    data: {
      userId,
      taskType: input.taskType,
      questionText: prepared.questionText,
      essayText: prepared.essayText,
      wordCount: prepared.essayText ? prepared.essayText.split(/\s+/).filter(Boolean).length : 0,
      status: "PROCESSING"
    }
  });

  let reservationId: string | null = null;
  try {
    const reservation = await reserveWritingQuota(userId, submission.id);
    reservationId = reservation.id;
    const plan = reservation.entitlementPeriod.plan as "FREE" | "PRO";
    const provider = getGradingProvider();

    const extracted = await provider.extractInputs({
      taskType: input.taskType,
      questionText: prepared.questionText || undefined,
      essayText: prepared.essayText || undefined,
      questionFile: prepared.questionFile,
      writingFile: prepared.writingFile
    });

    if (!extracted.questionReadable || extracted.errorCode === "QUESTION_IMAGE_UNREADABLE") {
      throw new WritingInputError(
        "QUESTION_IMAGE_UNREADABLE",
        "We couldn't read this question. The image may be blurry, cropped or incomplete. Please upload a clearer file."
      );
    }
    if (!extracted.essayReadable || extracted.errorCode === "ESSAY_UNREADABLE" || !extracted.essayText.trim()) {
      throw new WritingInputError("ESSAY_UNREADABLE", "We couldn't read your Writing response. Please upload a clearer file or paste the essay as text.");
    }

    const initial = await provider.gradeEssay(input.taskType, extracted, plan);
    const verifiedRaw = await provider.verifyGrade(input.taskType, extracted, initial);
    const verified = {
      ...verifiedRaw,
      taskCriterionBand: roundBand(verifiedRaw.taskCriterionBand),
      coherenceCohesionBand: roundBand(verifiedRaw.coherenceCohesionBand),
      lexicalResourceBand: roundBand(verifiedRaw.lexicalResourceBand),
      grammaticalRangeAccuracyBand: roundBand(verifiedRaw.grammaticalRangeAccuracyBand)
    };
    const sample = await provider.generateBand7Sample(input.taskType, extracted);
    const pro = plan === "PRO" ? await provider.generateProEnhancements(input.taskType, extracted, verified) : null;

    const estimatedOverallBand = overallBand([
      verified.taskCriterionBand,
      verified.coherenceCohesionBand,
      verified.lexicalResourceBand,
      verified.grammaticalRangeAccuracyBand
    ]);

    const result: FinalWritingResult = finalWritingResultSchema.parse({
      taskType: input.taskType,
      estimatedOverallBand,
      criteria: {
        taskCriterion: { ...initial.taskCriterion, band: verified.taskCriterionBand },
        coherenceCohesion: { ...initial.coherenceCohesion, band: verified.coherenceCohesionBand },
        lexicalResource: { ...initial.lexicalResource, band: verified.lexicalResourceBand },
        grammaticalRangeAccuracy: { ...initial.grammaticalRangeAccuracy, band: verified.grammaticalRangeAccuracyBand }
      },
      errors: initial.errors,
      sentenceImprovements: initial.sentenceImprovements,
      priorityImprovements: initial.priorityImprovements,
      mainIssue: initial.mainIssue,
      band7Sample: sample,
      detailedCriterionAnalysis: pro?.detailedCriterionAnalysis ?? null,
      improvedEssay: pro?.improvedEssay ?? null,
      nextBandGuidance: pro?.nextBandGuidance ?? null,
      verificationNotes: verified.adjustmentNotes,
      generatedForPlan: plan
    });

    const completed = await consumeWritingReservation(reservation.id, {
      questionText: extracted.questionText,
      structuredQuestionData: extracted.task1Visual,
      essayText: extracted.essayText,
      wordCount: extracted.wordCount,
      estimatedOverallBand,
      criterionScores: {
        taskCriterion: verified.taskCriterionBand,
        coherenceCohesion: verified.coherenceCohesionBand,
        lexicalResource: verified.lexicalResourceBand,
        grammaticalRangeAccuracy: verified.grammaticalRangeAccuracyBand
      },
      resultJson: result,
      planAtSubmission: plan,
      gradingProvider: provider.name,
      gradingModel: provider.model
    });

    return { submissionId: completed.id, result };
  } catch (error) {
    if (reservationId) await releaseWritingReservation(reservationId);
    const failureCode =
      error instanceof WritingInputError || error instanceof UploadValidationError
        ? error.code
        : error instanceof QuotaExhaustedError
          ? "QUOTA_EXHAUSTED"
          : error instanceof WritingRateLimitedError
            ? "RATE_LIMITED"
            : "GRADING_FAILED";
    await prisma.writingSubmission.updateMany({
      where: { id: submission.id, status: { not: "COMPLETED" } },
      data: { status: "FAILED", failureCode }
    });
    throw error;
  }
}
