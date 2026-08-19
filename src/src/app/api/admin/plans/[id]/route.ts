import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const features = z.object({ bandScore: z.boolean(), criteria: z.boolean(), errorCorrection: z.boolean(), band7Sample: z.boolean(), improvedEssay: z.boolean(), nextBandGuidance: z.boolean() });
const schema = z.object({ name: z.string().trim().min(2).max(40), price: z.number().min(0), durationDays: z.number().int().min(1).max(3650), aiRequestLimit: z.number().int().min(0).max(10000), aiModel: z.string().trim().min(3).max(180), isVisible: z.boolean(), isFree: z.boolean(), features });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid plan." }, { status: 400 });
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.plan.findUnique({ where: { id } });
      if (!existing) throw Object.assign(new Error("Plan not found."), { status: 404 });
      if (existing.isFree && !parsed.data.isFree) throw Object.assign(new Error("Assign another free plan before changing the current Free plan."), { status: 400 });
      if (parsed.data.isFree) await tx.plan.updateMany({ where: { isFree: true, id: { not: id } }, data: { isFree: false } });
      await tx.plan.update({ where: { id }, data: { ...parsed.data, features: parsed.data.features as unknown as Prisma.InputJsonValue } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 409;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update plan." }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id }, include: { _count: { select: { users: true, promoCodes: true } } } });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  if (plan.isFree) return NextResponse.json({ error: "The default Free plan cannot be deleted." }, { status: 400 });
  if (plan._count.users > 0 || plan._count.promoCodes > 0) return NextResponse.json({ error: "This plan is referenced by users or promo codes. Hide it instead of deleting it." }, { status: 409 });
  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
