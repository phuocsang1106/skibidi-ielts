import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { formFile, extractTextFile, task1QuestionFile } from "@/lib/files";
import { wordCount } from "@/lib/utils";
import { assertCreditAvailable, consumeExactlyOneCredit } from "@/lib/services/credits";
import { getOperationalPlanForUser } from "@/lib/services/plans";
import { runTask1Pipeline, runTask2Pipeline } from "@/lib/ai/pipeline";
import { IELTS_RUBRIC_VERSION } from "@/lib/ai/rubric";
import { PROMPT_VERSION } from "@/lib/ai/logging";
import { pipelineSize } from "@/lib/ai/config";
import type { FinalGradingResult } from "@/lib/ai/schemas";
import { withSerializableRetry } from "@/lib/transactions";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function titleFrom(value: string) {
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized.length > 110 ? `${normalized.slice(0, 107)}...` : normalized || "IELTS Writing response";
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function resolveEssay(form: FormData) {
  const essayText = text(form.get("essayText"));
  if (essayText) return essayText;
  const essayFile = formFile(form.get("essayFile"));
  if (essayFile) {
    const extracted = await extractTextFile(essayFile, "essay");
    if (extracted) return extracted;
  }
  throw new AppError("INVALID_ESSAY", "Essay is empty.", 400, "Please enter or upload your Writing response. No Writing submission was deducted.");
}

async function resolveTask2Question(form: FormData) {
  let question = text(form.get("questionText"));
  const questionFile = formFile(form.get("questionFile"));
  if (questionFile) {
    const extracted = await extractTextFile(questionFile, "question");
    if (extracted && !question) question = extracted;
    else if (extracted) question = `${question}\n\nAdditional question file text:\n${extracted}`;
  }
  if (!question) throw new AppError("INVALID_QUESTION", "Task 2 question is required.", 400, "Please enter the Task 2 question. No Writing submission was deducted.");
  return question;
}

function resultCriteria(result: FinalGradingResult, taskType: "TASK_1" | "TASK_2") {
  return [
    ["taskCriterion", { ...result.criteria.taskCriterion, name: taskType === "TASK_1" ? "Task Achievement" : "Task Response" }],
    ["coherenceCohesion", { ...result.criteria.coherenceCohesion, name: "Coherence & Cohesion" }],
    ["lexicalResource", { ...result.criteria.lexicalResource, name: "Lexical Resource" }],
    ["grammaticalRangeAccuracy", { ...result.criteria.grammaticalRangeAccuracy, name: "Grammatical Range & Accuracy" }]
  ] as const;
}

function hasPrismaCode(error: unknown, expected: string) {
  return typeof error === "object" && error !== null && "code" in error && String((error as { code: unknown }).code) === expected;
}

async function persistSuccessfulResult(input: {
  userId: string;
  submissionId: string;
  idempotencyKey: string;
  planId: string;
  planName: string;
  features: string[];
  taskType: "TASK_1" | "TASK_2";
  questionText: string | null;
  questionTitle: string;
  essayText: string;
  pipelineSize: number;
  result: FinalGradingResult;
}) {
  try {
    return await withSerializableRetry(async (tx) => {
      const existing = await tx.writingSubmission.findUnique({
      where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } },
      include: { result: true }
    });
    if (existing?.result) return existing;

    const submission = await tx.writingSubmission.create({
      data: {
        id: input.submissionId,
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        planId: input.planId,
        planNameSnapshot: input.planName,
        featureSnapshot: input.features,
        taskType: input.taskType,
        questionText: input.questionText,
        questionTitle: input.questionTitle,
        normalizedQuestion: input.result.normalizedQuestion ? jsonValue(input.result.normalizedQuestion) : undefined,
        essayText: input.essayText,
        wordCount: wordCount(input.essayText),
        pipelineSize: input.pipelineSize,
        rubricVersion: IELTS_RUBRIC_VERSION,
        promptVersion: PROMPT_VERSION,
        result: {
          create: {
            overallBand: input.result.overallBand,
            mainIssue: input.result.mainIssue,
            errors: jsonValue(input.result.errors),
            sentenceImprovements: jsonValue(input.result.sentenceImprovements),
            priorityImprovements: jsonValue(input.result.priorityImprovements),
            band7Sample: input.result.band7Sample,
            improvedEssay: input.result.improvedEssay,
            detailedCriterionAnalysis: input.result.detailedCriterionAnalysis ? jsonValue(input.result.detailedCriterionAnalysis) : undefined,
            nextBandGuidance: input.result.nextBandGuidance ? jsonValue(input.result.nextBandGuidance) : undefined,
            verifierMetadata: input.result.verifierMetadata ? jsonValue(input.result.verifierMetadata) : undefined,
            criteria: {
              create: resultCriteria(input.result, input.taskType).map(([key, criterion]) => ({
                key,
                name: criterion.name,
                band: criterion.band,
                summary: criterion.summary,
                evidence: jsonValue(criterion.evidence),
                limitingWeaknesses: jsonValue(criterion.limitingWeaknesses)
              }))
            }
          }
        }
      },
      include: { result: true }
    });

      await consumeExactlyOneCredit(tx, input.userId, submission.id);
      return submission;
    });
  } catch (error) {
    // Two requests with the same idempotency key can finish AI work at nearly
    // the same time. The database unique constraint is the final arbiter.
    // If this request loses that race, return the winner instead of exposing
    // a Prisma conflict or consuming another credit.
    if (hasPrismaCode(error, "P2002")) {
      const winner = await prisma.writingSubmission.findUnique({
        where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } },
        include: { result: true }
      });
      if (winner?.result) return winner;
    }
    if (error instanceof AppError) throw error;
    throw new AppError(
      "WRITING_PERSISTENCE_ERROR",
      "Writing grading succeeded but the result transaction could not be committed.",
      503,
      "We couldn't save your grading result. No Writing submission was deducted."
    );
  }
}

export async function submitWriting(userId: string, form: FormData, signal?: AbortSignal) {
  const idempotencyKey = text(form.get("idempotencyKey"));
  if (!idempotencyKey || idempotencyKey.length > 120) throw new AppError("INVALID_IDEMPOTENCY_KEY", "Invalid submission key.", 400);

  const previous = await prisma.writingSubmission.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey } },
    select: { id: true }
  });
  if (previous) return { submissionId: previous.id, reused: true };

  await assertCreditAvailable(userId);
  const { subscription, plan, features } = await getOperationalPlanForUser(userId);
  const essayText = await resolveEssay(form);
  const rawTaskType = text(form.get("taskType"));
  const submissionId = randomUUID();
  const ctx = { logicalSubmissionId: submissionId, userId, plan, features, signal };

  if (rawTaskType === "TASK_1") {
    const questionFileValue = formFile(form.get("questionFile"));
    if (!questionFileValue) throw new AppError("INVALID_QUESTION", "Task 1 question file is required.", 400, "Upload the Task 1 question image or PDF. No Writing submission was deducted.");
    const questionFile = await task1QuestionFile(questionFileValue);
    const questionText = text(form.get("questionText")) || null;
    const result = await runTask1Pipeline(ctx, { questionText, essayText }, questionFile);
    const questionTitle = titleFrom(result.normalizedQuestion?.promptText || questionText || questionFile.name);
    const saved = await persistSuccessfulResult({
      userId,
      submissionId,
      idempotencyKey,
      planId: plan.id,
      planName: subscription.planNameSnapshot,
      features,
      taskType: "TASK_1",
      questionText,
      questionTitle,
      essayText,
      pipelineSize: pipelineSize(plan),
      result
    });
    return { submissionId: saved.id, reused: saved.id !== submissionId };
  }

  if (rawTaskType !== "TASK_2") throw new AppError("INVALID_TASK_TYPE", "Task type is invalid.", 400);
  const questionText = await resolveTask2Question(form);
  const result = await runTask2Pipeline(ctx, { questionText, essayText });
  const saved = await persistSuccessfulResult({
    userId,
    submissionId,
    idempotencyKey,
    planId: plan.id,
    planName: subscription.planNameSnapshot,
    features,
    taskType: "TASK_2",
    questionText,
    questionTitle: titleFrom(questionText),
    essayText,
    pipelineSize: pipelineSize(plan),
    result
  });
  return { submissionId: saved.id, reused: saved.id !== submissionId };
}
