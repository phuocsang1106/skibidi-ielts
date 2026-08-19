import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ensureFreeSubscription, getActiveSubscription } from "@/lib/services/subscriptions";

export async function getCreditSummary(userId: string) {
  const subscription = (await getActiveSubscription(userId)) ?? (await ensureFreeSubscription(userId));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { bonusSubmissionBalance: true } });
  return {
    planRemaining: subscription?.remainingPlanSubmissions ?? 0,
    bonusRemaining: user.bonusSubmissionBalance,
    totalRemaining: (subscription?.remainingPlanSubmissions ?? 0) + user.bonusSubmissionBalance,
    subscription
  };
}

export async function assertCreditAvailable(userId: string) {
  const summary = await getCreditSummary(userId);
  if (summary.totalRemaining < 1) {
    throw new AppError("NO_SUBMISSIONS", "No Writing submissions remaining.", 402, "You have no Writing submissions remaining.");
  }
  return summary;
}

export async function consumeExactlyOneCredit(tx: Prisma.TransactionClient, userId: string, submissionId: string) {
  const existingLedger = await tx.submissionCreditLedger.findUnique({ where: { submissionId } });
  if (existingLedger) return existingLedger;

  const now = new Date();
  const subscription = await tx.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
    },
    orderBy: { startsAt: "desc" }
  });

  if (subscription) {
    const changed = await tx.subscription.updateMany({
      where: { id: subscription.id, remainingPlanSubmissions: { gt: 0 } },
      data: { remainingPlanSubmissions: { decrement: 1 } }
    });
    if (changed.count === 1) {
      const fresh = await tx.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
      return tx.submissionCreditLedger.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          submissionId,
          bucket: "PLAN",
          kind: "CONSUME",
          delta: -1,
          balanceAfter: fresh.remainingPlanSubmissions,
          reason: "Successful Writing grading"
        }
      });
    }
  }

  const changedBonus = await tx.user.updateMany({
    where: { id: userId, bonusSubmissionBalance: { gt: 0 } },
    data: { bonusSubmissionBalance: { decrement: 1 } }
  });
  if (changedBonus.count === 1) {
    const freshUser = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { bonusSubmissionBalance: true } });
    return tx.submissionCreditLedger.create({
      data: {
        userId,
        submissionId,
        bucket: "BONUS",
        kind: "CONSUME",
        delta: -1,
        balanceAfter: freshUser.bonusSubmissionBalance,
        reason: "Successful Writing grading"
      }
    });
  }

  throw new AppError("NO_SUBMISSIONS", "No Writing submissions remaining.", 409, "You have no Writing submissions remaining. No Writing submission was deducted.");
}

export async function addBonusSubmissions(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  reason: string,
  sourceReferenceId?: string
) {
  if (!Number.isInteger(amount) || amount <= 0) throw new AppError("INVALID_CREDIT_AMOUNT", "Credit amount must be a positive integer.");
  const user = await tx.user.update({ where: { id: userId }, data: { bonusSubmissionBalance: { increment: amount } }, select: { bonusSubmissionBalance: true } });
  return tx.submissionCreditLedger.create({
    data: {
      userId,
      bucket: "BONUS",
      kind: "GRANT",
      delta: amount,
      balanceAfter: user.bonusSubmissionBalance,
      reason,
      sourceReferenceId
    }
  });
}
