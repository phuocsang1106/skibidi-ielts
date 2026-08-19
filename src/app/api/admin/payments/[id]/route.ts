import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(500).optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.bankPaymentRequest.findUnique({
        where: { id },
        include: { plan: true }
      });
      if (!payment) throw Object.assign(new Error("Payment not found."), { status: 404 });
      if (payment.status !== "PENDING") throw Object.assign(new Error("Payment already reviewed."), { status: 409 });

      const now = new Date();
      const nextStatus = parsed.data.action === "APPROVE" ? "APPROVED" : "REJECTED";
      const updated = await tx.bankPaymentRequest.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: nextStatus,
          reviewedAt: now,
          adminNote: parsed.data.note || null
        }
      });
      if (updated.count !== 1) throw Object.assign(new Error("Payment already reviewed."), { status: 409 });

      if (parsed.data.action === "APPROVE") {
        const expireAt = new Date(now.getTime() + payment.plan.durationDays * 86_400_000);
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            planId: payment.planId,
            planStartedAt: now,
            planExpireDate: expireAt
          }
        });
      }

      return { status: nextStatus };
    });

    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { error: status === 404 ? "Không tìm thấy yêu cầu." : status === 409 ? "Yêu cầu này đã được xử lý." : "Không thể cập nhật thanh toán." },
      { status }
    );
  }
}
