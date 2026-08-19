import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Z0-9_-]+$/),
  planId: z.string().min(1),
  duration: z.number().int().min(1).max(3650),
  isActive: z.boolean(),
  maxUses: z.number().int().min(1).nullable(),
  expiresAt: z.string().datetime().nullable()
});

export async function POST(request: NextRequest) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid promo." }, { status: 400 });
  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId }, select: { id: true } });
  if (!plan) return NextResponse.json({ error: "Reward plan not found." }, { status: 404 });
  try {
    const promo = await prisma.promoCode.create({ data: { ...parsed.data, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null } });
    return NextResponse.json({ id: promo.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Promo code already exists or could not be created." }, { status: 409 });
  }
}
