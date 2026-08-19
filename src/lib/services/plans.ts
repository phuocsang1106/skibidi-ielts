import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getActiveSubscription, ensureFreeSubscription } from "@/lib/services/subscriptions";

export async function listPublicPlans() {
  return prisma.plan.findMany({
    where: { visibility: "PUBLIC", isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceVnd: "asc" }]
  });
}

export async function getOperationalPlanForUser(userId: string) {
  const subscription = (await getActiveSubscription(userId)) ?? (await ensureFreeSubscription(userId));
  if (!subscription) throw new AppError("NO_ACTIVE_PLAN", "No active plan is available.", 503);
  const plan = await prisma.plan.findUnique({ where: { id: subscription.planId }, include: { aiConfig: true } });
  if (!plan) throw new AppError("PLAN_CONFIG_MISSING", "Plan configuration is missing.", 503, "Your plan configuration is temporarily unavailable.");
  return { subscription, plan, features: subscription.featureSnapshot };
}
