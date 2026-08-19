import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { grantSubscription } from "@/lib/services/subscriptions";
import { writeAudit } from "@/lib/services/audit";
import { withSerializableRetry } from "@/lib/transactions";

function transferCode() {
  return `SKB-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function expireStalePaymentOrders() {
  return prisma.paymentOrder.updateMany({
    where: { status: "PENDING", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" }
  });
}

export async function createPaymentOrder(userId: string, planId: string) {
  const plan = await prisma.plan.findFirst({ where: { id: planId, visibility: "PUBLIC", isActive: true } });
  if (!plan || plan.priceVnd <= 0) throw new AppError("PLAN_NOT_PURCHASABLE", "Plan cannot be purchased.", 404, "This plan is not available for purchase.");
  return prisma.paymentOrder.create({
    data: {
      userId,
      planId: plan.id,
      amountVnd: plan.priceVnd,
      transferCode: transferCode(),
      planNameSnapshot: plan.displayName,
      durationDaysSnapshot: plan.durationDays,
      submissionLimitSnapshot: plan.submissionLimit,
      featureSnapshot: plan.features,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
}

export async function reportTransfer(userId: string, orderId: string) {
  const changed = await prisma.paymentOrder.updateMany({
    where: { id: orderId, userId, status: "PENDING", expiresAt: { gt: new Date() } },
    data: { status: "TRANSFER_REPORTED", transferReportedAt: new Date() }
  });
  if (changed.count !== 1) {
    const existing = await prisma.paymentOrder.findFirst({ where: { id: orderId, userId } });
    if (existing?.status === "TRANSFER_REPORTED" || existing?.status === "APPROVED") return existing;
    if (existing?.status === "PENDING" && existing.expiresAt <= new Date()) {
      await prisma.paymentOrder.updateMany({ where: { id: existing.id, status: "PENDING" }, data: { status: "EXPIRED" } });
    }
    throw new AppError("PAYMENT_NOT_REPORTABLE", "Payment cannot be reported.", 409, "This payment order can no longer be reported.");
  }
  return prisma.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
}

export async function approvePayment(adminId: string, orderId: string) {
  return withSerializableRetry(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("PAYMENT_NOT_FOUND", "Payment not found.", 404);
    if (order.status === "APPROVED") return order;
    if (order.status !== "TRANSFER_REPORTED") throw new AppError("PAYMENT_NOT_REPORTED", "Payment has not been reported.", 409);

    const snapshot = {
      planId: order.planId,
      planNameSnapshot: order.planNameSnapshot,
      pricePaidVnd: order.amountVnd,
      durationDaysSnapshot: order.durationDaysSnapshot,
      submissionLimitSnapshot: order.submissionLimitSnapshot,
      featureSnapshot: order.featureSnapshot
    };
    await grantSubscription(tx, order.userId, snapshot, "PURCHASE", order.id, "SAFE_DEFAULT");
    const updated = await tx.paymentOrder.update({
      where: { id: order.id },
      data: { status: "APPROVED", approvedAt: new Date(), approvedByAdminId: adminId }
    });
    await writeAudit(tx, {
      adminId,
      action: "PAYMENT_APPROVED",
      entityType: "PaymentOrder",
      entityId: order.id,
      beforeJson: { status: order.status },
      afterJson: { status: "APPROVED", userId: order.userId, planId: order.planId, amountVnd: order.amountVnd }
    });
    return updated;
  });
}

export async function rejectPayment(adminId: string, orderId: string, reason: string) {
  return withSerializableRetry(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError("PAYMENT_NOT_FOUND", "Payment not found.", 404);
    if (order.status === "REJECTED") return order;
    if (order.status === "APPROVED") throw new AppError("PAYMENT_ALREADY_APPROVED", "Approved payments cannot be rejected.", 409);
    const updated = await tx.paymentOrder.update({
      where: { id: order.id },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectedByAdminId: adminId, rejectionReason: reason.trim().slice(0, 500) }
    });
    await writeAudit(tx, { adminId, action: "PAYMENT_REJECTED", entityType: "PaymentOrder", entityId: order.id, beforeJson: { status: order.status }, afterJson: { status: "REJECTED" }, reason });
    return updated;
  });
}
