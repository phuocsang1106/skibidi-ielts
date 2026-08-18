import { prisma } from "@/lib/db/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const CYCLE_MS = 30 * DAY_MS;
const RESERVATION_MS = 60 * 60 * 1000;

export class QuotaExhaustedError extends Error {
  constructor(
    public readonly plan: "FREE" | "PRO",
    public readonly limit: number,
    public readonly resetAt: Date
  ) {
    super(`Writing quota exhausted for ${plan}.`);
  }
}

function currentCycleStart(anchor: Date, now: Date) {
  if (anchor >= now) return anchor;
  const elapsed = now.getTime() - anchor.getTime();
  const cycles = Math.floor(elapsed / CYCLE_MS);
  return new Date(anchor.getTime() + cycles * CYCLE_MS);
}

export async function ensureCurrentEntitlement(userId: string) {
  const now = new Date();
  const currentPro = await prisma.entitlementPeriod.findFirst({
    where: { userId, plan: "PRO", isActive: true, startAt: { lte: now }, endAt: { gt: now } },
    orderBy: { endAt: "desc" }
  });
  if (currentPro) return currentPro;

  const currentFree = await prisma.entitlementPeriod.findFirst({
    where: { userId, plan: "FREE", isActive: true, startAt: { lte: now }, endAt: { gt: now } },
    orderBy: { startAt: "desc" }
  });
  if (currentFree) return currentFree;

  const latestPeriod = await prisma.entitlementPeriod.findFirst({
    where: { userId },
    orderBy: { endAt: "desc" }
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } });
  const anchor = latestPeriod?.endAt ?? user.createdAt;
  const startAt = currentCycleStart(anchor, now);
  const endAt = new Date(startAt.getTime() + CYCLE_MS);

  return prisma.entitlementPeriod.create({
    data: {
      userId,
      plan: "FREE",
      source: "FREE_CYCLE",
      startAt,
      endAt,
      quotaLimit: 3
    }
  });
}

export async function getEntitlementSummary(userId: string) {
  const current = await ensureCurrentEntitlement(userId);
  const now = new Date();
  const scheduledPro = await prisma.entitlementPeriod.findFirst({
    where: { userId, plan: "PRO", isActive: true, endAt: { gt: now } },
    orderBy: { endAt: "desc" }
  });
  return {
    plan: current.plan,
    quotaLimit: current.quotaLimit,
    quotaUsed: current.quotaUsed,
    quotaRemaining: Math.max(0, current.quotaLimit - current.quotaUsed),
    resetAt: current.endAt,
    proExpiry: scheduledPro?.endAt ?? null
  };
}

export async function reserveWritingQuota(userId: string, writingSubmissionId: string) {
  await ensureCurrentEntitlement(userId);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    await tx.writingReservation.updateMany({
      where: { userId, status: "RESERVED", expiresAt: { lte: now } },
      data: { status: "RELEASED" }
    });

    const entitlement = await tx.entitlementPeriod.findFirst({
      where: { userId, isActive: true, startAt: { lte: now }, endAt: { gt: now } },
      orderBy: [{ plan: "desc" }, { startAt: "desc" }]
    });
    if (!entitlement) throw new Error("No active entitlement period.");

    const reservedCount = await tx.writingReservation.count({
      where: { entitlementPeriodId: entitlement.id, status: "RESERVED", expiresAt: { gt: now } }
    });
    if (entitlement.quotaUsed + reservedCount >= entitlement.quotaLimit) {
      throw new QuotaExhaustedError(entitlement.plan, entitlement.quotaLimit, entitlement.endAt);
    }

    return tx.writingReservation.create({
      data: {
        userId,
        entitlementPeriodId: entitlement.id,
        writingSubmissionId,
        expiresAt: new Date(now.getTime() + RESERVATION_MS)
      },
      include: { entitlementPeriod: true }
    });
  }, { isolationLevel: "Serializable" });
}

export async function releaseWritingReservation(reservationId: string) {
  await prisma.writingReservation.updateMany({
    where: { id: reservationId, status: "RESERVED" },
    data: { status: "RELEASED" }
  });
}

export async function consumeWritingReservation(
  reservationId: string,
  submissionData: {
    questionText: string;
    structuredQuestionData: unknown | null;
    essayText: string;
    wordCount: number;
    estimatedOverallBand: number;
    criterionScores: unknown;
    resultJson: unknown;
    planAtSubmission: "FREE" | "PRO";
    gradingProvider: string;
    gradingModel: string;
  }
) {
  const reservation = await prisma.writingReservation.findUniqueOrThrow({ where: { id: reservationId } });

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${reservation.userId}))`;
    const lockedReservation = await tx.writingReservation.findUniqueOrThrow({ where: { id: reservationId } });
    if (lockedReservation.status !== "RESERVED") throw new Error("Writing reservation is no longer active.");

    const entitlement = await tx.entitlementPeriod.findUniqueOrThrow({ where: { id: lockedReservation.entitlementPeriodId } });
    if (entitlement.quotaUsed >= entitlement.quotaLimit) throw new QuotaExhaustedError(entitlement.plan, entitlement.quotaLimit, entitlement.endAt);

    await tx.entitlementPeriod.update({
      where: { id: entitlement.id },
      data: { quotaUsed: { increment: 1 } }
    });
    await tx.writingReservation.update({ where: { id: reservationId }, data: { status: "CONSUMED" } });
    return tx.writingSubmission.update({
      where: { id: lockedReservation.writingSubmissionId },
      data: {
        ...submissionData,
        structuredQuestionData: submissionData.structuredQuestionData ?? undefined,
        criterionScores: submissionData.criterionScores,
        resultJson: submissionData.resultJson,
        status: "COMPLETED",
        completedAt: new Date(),
        failureCode: null
      }
    });
  }, { isolationLevel: "Serializable" });
}
