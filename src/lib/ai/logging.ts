import { prisma } from "@/lib/db";
import type { AiErrorCategory } from "@/generated/prisma/client";
import type { AiStage } from "@/lib/ai/config";

export const PROMPT_VERSION = "SKIBIDI_WRITING_V2_2026_08";

export type AiLogContext = {
  logicalSubmissionId: string;
  userId: string;
  planId: string;
  stage: AiStage;
  pipelineSize: number;
  model: string;
  rubricVersion: string;
};

export type AiUsage = { inputTokens?: number; outputTokens?: number; totalTokens?: number; costUsd?: number };

function safeMessage(error: unknown) {
  let value = error instanceof Error ? error.message : String(error);
  value = value.replace(/data:[^\s]+/g, "[file-data-redacted]").replace(/sk-or-[A-Za-z0-9_-]+/g, "[secret-redacted]");
  for (const secret of [process.env.OPENROUTER_API_KEY, process.env.SESSION_SECRET, process.env.DATABASE_URL]) {
    if (secret && secret.length >= 8) value = value.split(secret).join("[secret-redacted]");
  }
  return value.slice(0, 800);
}

export async function logAiSuccess(ctx: AiLogContext, startedAt: Date, providerStatus: number | undefined, usage: AiUsage) {
  try {
    await prisma.aiCallLog.create({ data: {
      logicalSubmissionId: ctx.logicalSubmissionId,
      userId: ctx.userId,
      planId: ctx.planId,
      stage: ctx.stage,
      pipelineSize: ctx.pipelineSize,
      model: ctx.model,
      startedAt,
      latencyMs: Date.now() - startedAt.getTime(),
      providerStatus,
      status: "SUCCESS",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      costUsd: usage.costUsd,
      promptVersion: PROMPT_VERSION,
      rubricVersion: ctx.rubricVersion
    } });
  } catch (error) {
    console.error("AI diagnostic logging failed", safeMessage(error));
  }
}

export async function logAiFailure(ctx: AiLogContext, startedAt: Date, providerStatus: number | undefined, category: AiErrorCategory, error: unknown, errorCode?: string) {
  try {
    await prisma.aiCallLog.create({ data: {
      logicalSubmissionId: ctx.logicalSubmissionId,
      userId: ctx.userId,
      planId: ctx.planId,
      stage: ctx.stage,
      pipelineSize: ctx.pipelineSize,
      model: ctx.model,
      startedAt,
      latencyMs: Date.now() - startedAt.getTime(),
      providerStatus,
      status: "FAILURE",
      errorCategory: category,
      errorCode,
      sanitizedError: safeMessage(error),
      promptVersion: PROMPT_VERSION,
      rubricVersion: ctx.rubricVersion
    } });
  } catch (logError) {
    console.error("AI diagnostic logging failed", safeMessage(logError));
  }
}

export async function markAiCallSemanticFailure(logicalSubmissionId: string, stage: AiStage, category: AiErrorCategory, message: string) {
  try {
    const row = await prisma.aiCallLog.findFirst({
      where: { logicalSubmissionId, stage },
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });
    if (!row) return;
    await prisma.aiCallLog.update({
      where: { id: row.id },
      data: { status: "FAILURE", errorCategory: category, sanitizedError: safeMessage(new Error(message)) }
    });
  } catch {
    // Diagnostics must not replace the user-facing semantic error.
  }
}
