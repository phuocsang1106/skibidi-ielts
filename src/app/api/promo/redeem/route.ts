import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promoSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const parsed = promoSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid promo code." }, { status: 400 });
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const promo = await tx.promoCode.findUnique({ where: { code: parsed.data.code }, include: { plan: true } });
      if (!promo || !promo.isActive) throw Object.assign(new Error("Promo code is invalid or inactive."), { status: 400 });
      if (promo.expiresAt && promo.expiresAt <= now) throw Object.assign(new Error("Promo code has expired."), { status: 400 });
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw Object.assign(new Error("Promo code has reached its usage limit."), { status: 400 });
      const redeemed = await tx.promoRedemption.findUnique({ where: { promoId_userId: { promoId: promo.id, userId: user.id } } });
      if (redeemed) throw Object.assign(new Error("You have already redeemed this promo code."), { status: 409 });

      const expireDate = new Date(now.getTime() + promo.duration * 24 * 60 * 60 * 1000);
      await tx.promoRedemption.create({ data: { promoId: promo.id, userId: user.id } });
      await tx.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
      await tx.user.update({ where: { id: user.id }, data: { planId: promo.planId, planStartedAt: now, planExpireDate: expireDate } });
      return { plan: promo.plan.name, expiresAt: expireDate };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json(result);
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    console.error("promo_redeem_error", error);
    const message = status < 500 && error instanceof Error ? error.message : "Could not redeem promo code.";
    return NextResponse.json({ error: message }, { status });
  }
}
