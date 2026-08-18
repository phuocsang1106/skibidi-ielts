import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function transferCode() {
  return `SKB ${crypto.randomBytes(4).toString("hex").slice(0, 7).toUpperCase()}`;
}

export async function getPaymentConfiguration() {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ["bankName", "bankAccountNumber", "bankAccountHolder", "bankQrImageUrl", "proPriceVnd"] } }
  });
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    bankName: settings.bankName || env.BANK_NAME,
    bankAccountNumber: settings.bankAccountNumber || env.BANK_ACCOUNT_NUMBER,
    bankAccountHolder: settings.bankAccountHolder || env.BANK_ACCOUNT_HOLDER,
    bankQrImageUrl: settings.bankQrImageUrl || env.BANK_QR_IMAGE_URL,
    proPriceVnd: Number(settings.proPriceVnd || env.PRO_PRICE_VND)
  };
}

export async function createPaymentOrder(userId: string) {
  const existing = await prisma.paymentOrder.findFirst({
    where: { userId, status: { in: ["PENDING", "AWAITING_VERIFICATION"] } },
    orderBy: { createdAt: "desc" }
  });
  if (existing) return existing;
  const config = await getPaymentConfiguration();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await prisma.paymentOrder.create({
        data: { userId, transferCode: transferCode(), amount: config.proPriceVnd }
      });
    } catch (error) {
      if (!(typeof error === "object" && error && "code" in error && error.code === "P2002")) throw error;
    }
  }
  throw new Error("Unable to generate a unique transfer code.");
}

export async function markPaymentTransferred(userId: string, orderId: string) {
  const updated = await prisma.paymentOrder.updateMany({
    where: { id: orderId, userId, status: "PENDING" },
    data: { status: "AWAITING_VERIFICATION" }
  });
  if (updated.count !== 1) throw new Error("Payment order is not pending or does not belong to this user.");
  return prisma.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
}

async function scheduleProPeriod(
  tx: Prisma.TransactionClient,
  userId: string,
  source: "PAYMENT" | "ADMIN_GRANT",
  sourcePaymentOrderId?: string,
  days = 30
) {
  const now = new Date();
  const latestPro = await tx.entitlementPeriod.findFirst({
    where: { userId, plan: "PRO", isActive: true, endAt: { gt: now } },
    orderBy: { endAt: "desc" }
  });
  const startAt = latestPro?.endAt ?? now;
  const endAt = new Date(startAt.getTime() + days * 24 * 60 * 60 * 1000);

  if (!latestPro) {
    await tx.entitlementPeriod.updateMany({
      where: { userId, plan: "FREE", isActive: true, startAt: { lte: now }, endAt: { gt: now } },
      data: { isActive: false }
    });
  }

  return tx.entitlementPeriod.create({
    data: {
      userId,
      plan: "PRO",
      source,
      startAt,
      endAt,
      quotaLimit: 10,
      sourcePaymentOrderId
    }
  });
}

export async function confirmPayment(orderId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${order.userId}))`;
    if (order.status === "PAID") return order;
    if (order.status === "REJECTED") throw new Error("Rejected payments cannot be confirmed.");

    const paid = await tx.paymentOrder.update({
      where: { id: orderId },
      data: { status: "PAID", confirmedAt: new Date(), confirmedByAdminId: adminId }
    });
    await scheduleProPeriod(tx, order.userId, "PAYMENT", order.id);
    return paid;
  }, { isolationLevel: "Serializable" });
}

export async function rejectPayment(orderId: string, adminId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === "PAID") throw new Error("Paid orders cannot be rejected.");
    if (order.status === "REJECTED") return order;
    return tx.paymentOrder.update({
      where: { id: orderId },
      data: { status: "REJECTED", confirmedAt: new Date(), confirmedByAdminId: adminId, rejectionReason: reason || null }
    });
  });
}

export async function grantPro(userId: string, days = 30) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    return scheduleProPeriod(tx, userId, "ADMIN_GRANT", undefined, days);
  }, { isolationLevel: "Serializable" });
}

export async function setCustomProExpiry(userId: string, expiry: Date) {
  const now = new Date();
  if (expiry <= now) throw new Error("Expiry must be in the future.");
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    await tx.entitlementPeriod.updateMany({
      where: { userId, plan: "PRO", isActive: true, endAt: { gt: now } },
      data: { isActive: false }
    });
    await tx.entitlementPeriod.updateMany({
      where: { userId, plan: "FREE", isActive: true, startAt: { lte: now }, endAt: { gt: now } },
      data: { isActive: false }
    });
    return tx.entitlementPeriod.create({
      data: { userId, plan: "PRO", source: "ADMIN_GRANT", startAt: now, endAt: expiry, quotaLimit: 10 }
    });
  }, { isolationLevel: "Serializable" });
}

export async function revokePro(userId: string) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    await tx.entitlementPeriod.updateMany({
      where: { userId, plan: "PRO", isActive: true, endAt: { gt: now } },
      data: { isActive: false }
    });
    return tx.entitlementPeriod.create({
      data: {
        userId,
        plan: "FREE",
        source: "FREE_CYCLE",
        startAt: now,
        endAt: new Date(now.getTime() + THIRTY_DAYS_MS),
        quotaLimit: 3
      }
    });
  }, { isolationLevel: "Serializable" });
}
