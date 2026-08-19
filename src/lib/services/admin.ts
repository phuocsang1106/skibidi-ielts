import { AppError } from "@/lib/errors";
import { addBonusSubmissions } from "@/lib/services/credits";
import { auditJson, writeAudit } from "@/lib/services/audit";
import { withSerializableRetry } from "@/lib/transactions";

export type PlanUpsertInput = {
  slug: string;
  displayName: string;
  description: string;
  priceVnd: number;
  durationDays: number | null;
  submissionLimit: number;
  features: string[];
  visibility: "PUBLIC" | "HIDDEN" | "ARCHIVED";
  sortOrder: number;
  badge: string | null;
  isActive: boolean;
  aiRequestsPerSubmission: number;
  defaultModel: string | null;
  aiConfig: {
    task1VisionModel?: string | null;
    task1ExaminerModel?: string | null;
    task1VerifierModel?: string | null;
    task1FeedbackModel?: string | null;
    task2ExaminerModel?: string | null;
    task2VerifierModel?: string | null;
    task2FeedbackModel?: string | null;
    task2TeachingModel?: string | null;
  };
};

export async function createPlan(adminId: string, input: PlanUpsertInput) {
  return withSerializableRetry(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        slug: input.slug,
        displayName: input.displayName,
        description: input.description,
        priceVnd: input.priceVnd,
        durationDays: input.durationDays,
        submissionLimit: input.submissionLimit,
        features: input.features,
        visibility: input.visibility,
        sortOrder: input.sortOrder,
        badge: input.badge,
        isActive: input.isActive,
        aiRequestsPerSubmission: input.aiRequestsPerSubmission,
        defaultModel: input.defaultModel,
        aiConfig: { create: input.aiConfig }
      },
      include: { aiConfig: true }
    });
    await writeAudit(tx, { adminId, action: "PLAN_CREATED", entityType: "Plan", entityId: plan.id, afterJson: auditJson(plan) });
    return plan;
  });
}

export async function updatePlan(adminId: string, planId: string, input: PlanUpsertInput, reason?: string) {
  return withSerializableRetry(async (tx) => {
    const before = await tx.plan.findUnique({ where: { id: planId }, include: { aiConfig: true } });
    if (!before) throw new AppError("PLAN_NOT_FOUND", "Plan not found.", 404);
    const plan = await tx.plan.update({
      where: { id: planId },
      data: {
        slug: input.slug,
        displayName: input.displayName,
        description: input.description,
        priceVnd: input.priceVnd,
        durationDays: input.durationDays,
        submissionLimit: input.submissionLimit,
        features: input.features,
        visibility: input.visibility,
        sortOrder: input.sortOrder,
        badge: input.badge,
        isActive: input.isActive,
        aiRequestsPerSubmission: input.aiRequestsPerSubmission,
        defaultModel: input.defaultModel,
        aiConfig: { upsert: { create: input.aiConfig, update: input.aiConfig } }
      },
      include: { aiConfig: true }
    });
    await writeAudit(tx, {
      adminId,
      action: "PLAN_UPDATED",
      entityType: "Plan",
      entityId: plan.id,
      beforeJson: auditJson(before),
      afterJson: auditJson(plan),
      reason
    });
    return plan;
  });
}

export async function deleteOrArchivePlan(adminId: string, planId: string) {
  return withSerializableRetry(async (tx) => {
    const plan = await tx.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError("PLAN_NOT_FOUND", "Plan not found.", 404);
    const [subscriptions, payments, promos, writings] = await Promise.all([
      tx.subscription.count({ where: { planId } }),
      tx.paymentOrder.count({ where: { planId } }),
      tx.promoCode.count({ where: { grantPlanId: planId } }),
      tx.writingSubmission.count({ where: { planId } })
    ]);
    const referenced = subscriptions + payments + promos + writings > 0;
    if (!referenced) {
      await tx.plan.delete({ where: { id: planId } });
      await writeAudit(tx, { adminId, action: "PLAN_DELETED", entityType: "Plan", entityId: planId, beforeJson: auditJson(plan) });
      return { deleted: true as const };
    }
    const archived = await tx.plan.update({ where: { id: planId }, data: { visibility: "ARCHIVED", isActive: false } });
    await writeAudit(tx, { adminId, action: "PLAN_ARCHIVED", entityType: "Plan", entityId: planId, beforeJson: auditJson(plan), afterJson: auditJson(archived) });
    return { deleted: false as const, plan: archived };
  });
}

export async function grantManualSubmissions(adminId: string, userId: string, amount: number, reason: string) {
  if (!reason.trim()) throw new AppError("REASON_REQUIRED", "A reason is required.");
  return withSerializableRetry(async (tx) => {
    const ledger = await addBonusSubmissions(tx, userId, amount, `Admin grant: ${reason}`, adminId);
    await writeAudit(tx, { adminId, action: "SUBMISSIONS_GRANTED", entityType: "User", entityId: userId, afterJson: { amount, ledgerId: ledger.id }, reason });
    return ledger;
  });
}
