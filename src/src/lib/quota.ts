import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getUsageForPlanPeriod(userId: string, planStartedAt: Date) {
  const aggregate = await prisma.aIUsage.aggregate({
    where: { userId, date: { gte: planStartedAt } },
    _sum: { requestCount: true }
  });
  return aggregate._sum.requestCount ?? 0;
}

export async function getQuota(user: { id: string; planStartedAt: Date; planExpireDate: Date | null; plan: Plan }) {
  const used = await getUsageForPlanPeriod(user.id, user.planStartedAt);
  const expired = Boolean(user.planExpireDate && user.planExpireDate.getTime() <= Date.now());
  const remaining = expired ? 0 : Math.max(0, user.plan.aiRequestLimit - used);
  return { used, remaining, expired, limit: user.plan.aiRequestLimit };
}
