import { AppError } from "@/lib/errors";
import { addBonusSubmissions } from "@/lib/services/credits";
import { grantSubscription, snapshotFromPlan } from "@/lib/services/subscriptions";
import { withSerializableRetry } from "@/lib/transactions";

export function normalizePromoCode(code: string) {
  return code.trim().toUpperCase();
}

export async function redeemPromo(userId: string, rawCode: string) {
  const code = normalizePromoCode(rawCode);
  if (!code) throw new AppError("PROMO_INVALID", "Invalid promo code.", 400, "This promo code is invalid.");

  try {
    return await withSerializableRetry(async (tx) => {
    const promo = await tx.promoCode.findUnique({ where: { code }, include: { grantPlan: true } });
    const now = new Date();
    if (!promo || !promo.isActive || promo.archivedAt || (promo.expiresAt && promo.expiresAt <= now)) {
      throw new AppError("PROMO_INVALID_OR_EXPIRED", "Promo code is invalid or expired.", 400, "This promo code is invalid or expired.");
    }

    const [total, userCount] = await Promise.all([
      tx.promoRedemption.count({ where: { promoCodeId: promo.id } }),
      tx.promoRedemption.count({ where: { promoCodeId: promo.id, userId } })
    ]);
    if (promo.maxTotalRedemptions != null && total >= promo.maxTotalRedemptions) {
      throw new AppError("PROMO_GLOBAL_LIMIT", "Promo redemption limit reached.", 409, "This promo code has reached its redemption limit.");
    }
    if (userCount >= promo.redemptionLimitPerUser) {
      throw new AppError("PROMO_ALREADY_USED", "Promo already used by this user.", 409, "You have already used this promo code.");
    }

    const ordinal = userCount + 1;
    if (promo.rewardType === "ADD_SUBMISSIONS") {
      const amount = promo.addSubmissions;
      if (!amount || amount <= 0) throw new AppError("PROMO_MISCONFIGURED", "Promo reward is misconfigured.", 500, "This promo code is temporarily unavailable.");
      await addBonusSubmissions(tx, userId, amount, `Promo ${promo.code}`, promo.id);
      await tx.promoRedemption.create({ data: { promoCodeId: promo.id, userId, ordinal, rewardJson: { type: "ADD_SUBMISSIONS", amount } } });
      return { type: "ADD_SUBMISSIONS" as const, amount };
    }

    const plan = promo.grantPlan;
    if (!plan || !plan.isActive || plan.visibility === "ARCHIVED") {
      throw new AppError("PROMO_PLAN_UNAVAILABLE", "Promo target plan cannot receive new grants.", 409, "This promo code is temporarily unavailable.");
    }
    const snapshot = snapshotFromPlan(plan, 0);
    snapshot.durationDaysSnapshot = promo.grantDurationDays ?? plan.durationDays;
    const subscription = await grantSubscription(tx, userId, snapshot, "PROMO", promo.id, promo.activationBehavior);
    await tx.promoRedemption.create({ data: { promoCodeId: promo.id, userId, ordinal, rewardJson: { type: "GRANT_PLAN", planId: plan.id, planName: plan.displayName, subscriptionId: subscription.id } } });
    return { type: "GRANT_PLAN" as const, planName: plan.displayName, queued: subscription.status === "QUEUED" };
    });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
    if (code === "P2002") {
      throw new AppError("PROMO_ALREADY_USED", "Promo redemption already exists.", 409, "You have already used this promo code.");
    }
    throw error;
  }
}
