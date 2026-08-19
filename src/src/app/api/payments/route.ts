import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";

const schema = z.object({ planId: z.string().min(1) });

function createTransferCode() {
  return `SKB${randomUUID().replaceAll("-", "").slice(0, 9).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    await assertRateLimit("payment-request", user.id, 8, 60 * 60);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Gói không hợp lệ." }, { status: 400 });

    const plan = await prisma.plan.findFirst({
      where: { id: parsed.data.planId, isVisible: true, isFree: false }
    });
    if (!plan) return NextResponse.json({ error: "Không tìm thấy gói thanh toán." }, { status: 404 });

    const existing = await prisma.bankPaymentRequest.findFirst({
      where: { userId: user.id, planId: plan.id, status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        status: existing.status,
        transferCode: existing.transferCode,
        amount: existing.amount.toString(),
        planName: plan.name,
        durationDays: plan.durationDays
      });
    }

    const payment = await prisma.bankPaymentRequest.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        transferCode: createTransferCode()
      }
    });

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      transferCode: payment.transferCode,
      amount: payment.amount.toString(),
      planName: plan.name,
      durationDays: plan.durationDays
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { error: status === 429 ? "Bạn tạo yêu cầu quá nhanh. Vui lòng thử lại sau." : "Không thể tạo yêu cầu thanh toán." },
      { status }
    );
  }
}
