import type { Prisma, PromoActivationBehavior, SubscriptionSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { withSerializableRetry } from "@/lib/transactions";

export type SubscriptionSnapshot = {
  planId: string;
  planNameSnapshot: string;
  pricePaidVnd: number;
  durationDaysSnapshot: number | null;
  submissionLimitSnapshot: number;
  featureSnapshot: string[];
};

function addDays(date: Date, days: number | null) {
  return days == null ? null : new Date(date.getTime() + days * 86_400_000);
}

export function snapshotFromPlan(plan: {
  id: string;
  displayName: string;
  priceVnd: number;
  durationDays: number | null;
  submissionLimit: number;
  features: string[];
}, pricePaidVnd = plan.priceVnd): SubscriptionSnapshot {
  return {
    planId: plan.id,
    planNameSnapshot: plan.displayName,
    pricePaidVnd,
    durationDaysSnapshot: plan.durationDays,
    submissionLimitSnapshot: plan.submissionLimit,
    featureSnapshot: [...plan.features]
  };
}

export async function refreshSubscriptions(userId: string) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { userId, status: "ACTIVE", expiresAt: { lte: now } },
      data: { status: "EXPIRED" }
    });
    const active = await tx.subscription.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { startsAt: "desc" } });
    if (!active) {
      const queued = await tx.subscription.findFirst({ where: { userId, status: "QUEUED" }, orderBy: { startsAt: "asc" } });
      if (queued) {
        const durationMs = queued.durationDaysSnapshot == null ? null : queued.durationDaysSnapshot * 86_400_000;
        await tx.subscription.update({
          where: { id: queued.id },
          data: { status: "ACTIVE", startsAt: now, expiresAt: durationMs == null ? null : new Date(now.getTime() + durationMs) }
        });
      }
    }
  });
}

export async function getActiveSubscription(userId: string) {
  await refreshSubscriptions(userId);
  return prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { startsAt: "desc" },
    include: { plan: { include: { aiConfig: true } } }
  });
}

export async function ensureFreeSubscription(userId: string) {
  return withSerializableRetry(async (tx) => {
    const now = new Date();
    await tx.subscription.updateMany({
      where: { userId, status: "ACTIVE", expiresAt: { lte: now } },
      data: { status: "EXPIRED" }
    });

    const active = await tx.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { startsAt: "desc" },
      include: { plan: { include: { aiConfig: true } } }
    });
    if (active) return active;

    const queued = await tx.subscription.findFirst({
      where: { userId, status: "QUEUED" },
      orderBy: { startsAt: "asc" }
    });
    if (queued) {
      const activated = await tx.subscription.update({
        where: { id: queued.id },
        data: {
          status: "ACTIVE",
          startsAt: now,
          expiresAt: addDays(now, queued.durationDaysSnapshot)
        },
        include: { plan: { include: { aiConfig: true } } }
      });
      return activated;
    }

    const freePlan = await tx.plan.findFirst({
      where: { isActive: true, priceVnd: 0, visibility: { in: ["PUBLIC", "HIDDEN"] } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    if (!freePlan) throw new AppError("NO_BASE_PLAN", "No free plan is configured.", 503, "The free plan is temporarily unavailable.");

    return tx.subscription.create({
      data: {
        userId,
        status: "ACTIVE",
        source: "FREE",
        ...snapshotFromPlan(freePlan, 0),
        remainingPlanSubmissions: freePlan.submissionLimit,
        startsAt: now,
        expiresAt: addDays(now, freePlan.durationDays)
      },
      include: { plan: { include: { aiConfig: true } } }
    });
  });
}

export async function grantSubscription(
  tx: Prisma.TransactionClient,
  userId: string,
  snapshot: SubscriptionSnapshot,
  source: SubscriptionSource,
  sourceReferenceId: string | null,
  behavior: PromoActivationBehavior | "SAFE_DEFAULT" = "SAFE_DEFAULT"
) {
  const now = new Date();
  const current = await tx.subscription.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { startsAt: "desc" } });
  const currentIsPaid = Boolean(current && current.pricePaidVnd > 0 && (current.expiresAt == null || current.expiresAt > now));
  const shouldQueue = currentIsPaid && behavior !== "ACTIVATE_NOW";

  if (shouldQueue && current) {
    return tx.subscription.create({
      data: {
        userId,
        ...snapshot,
        source,
        sourceReferenceId,
        status: "QUEUED",
        remainingPlanSubmissions: snapshot.submissionLimitSnapshot,
        startsAt: current.expiresAt || now,
        expiresAt: current.expiresAt && snapshot.durationDaysSnapshot != null ? addDays(current.expiresAt, snapshot.durationDaysSnapshot) : null
      }
    });
  }

  if (current) {
    if (currentIsPaid && behavior === "ACTIVATE_NOW") {
      const remainingDays = current.expiresAt ? Math.max(1, Math.ceil((current.expiresAt.getTime() - now.getTime()) / 86_400_000)) : current.durationDaysSnapshot;
      await tx.subscription.update({
        where: { id: current.id },
        data: {
          status: "QUEUED",
          startsAt: addDays(now, snapshot.durationDaysSnapshot) || now,
          expiresAt: snapshot.durationDaysSnapshot == null ? null : addDays(addDays(now, snapshot.durationDaysSnapshot) || now, remainingDays)
        }
      });
    } else {
      await tx.subscription.update({ where: { id: current.id }, data: { status: "CANCELLED" } });
    }
  }

  return tx.subscription.create({
    data: {
      userId,
      ...snapshot,
      source,
      sourceReferenceId,
      status: "ACTIVE",
      remainingPlanSubmissions: snapshot.submissionLimitSnapshot,
      startsAt: now,
      expiresAt: addDays(now, snapshot.durationDaysSnapshot)
    }
  });
}
