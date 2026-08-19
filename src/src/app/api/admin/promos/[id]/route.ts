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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid promo." }, { status: 400 });
  const { id } = await params;
  try {
    await prisma.promoCode.update({ where: { id }, data: { ...parsed.data, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update promo. Check code uniqueness." }, { status: 409 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const promo = await prisma.promoCode.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
  if (!promo) return NextResponse.json({ error: "Promo not found." }, { status: 404 });
  if (promo._count.redemptions > 0) {
    await prisma.promoCode.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
