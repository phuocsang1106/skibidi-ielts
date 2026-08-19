import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ planId: z.string().min(1) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  const { id } = await params;
  const now = new Date();
  const planExpireDate = plan.isFree ? null : new Date(now.getTime() + plan.durationDays * 86400000);
  await prisma.user.update({ where: { id }, data: { planId: plan.id, planStartedAt: now, planExpireDate } });
  return NextResponse.json({ ok: true });
}
