import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const features = z.object({ bandScore: z.boolean(), criteria: z.boolean(), errorCorrection: z.boolean(), band7Sample: z.boolean(), improvedEssay: z.boolean(), nextBandGuidance: z.boolean() });
const schema = z.object({ name: z.string().trim().min(2).max(40), price: z.number().min(0), durationDays: z.number().int().min(1).max(3650), aiRequestLimit: z.number().int().min(0).max(10000), aiModel: z.string().trim().min(3).max(180), isVisible: z.boolean(), isFree: z.boolean(), features });

export async function POST(request: NextRequest) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid plan." }, { status: 400 });
  try {
    const plan = await prisma.$transaction(async (tx) => {
      if (parsed.data.isFree) await tx.plan.updateMany({ where: { isFree: true }, data: { isFree: false } });
      return tx.plan.create({ data: { ...parsed.data, features: parsed.data.features as unknown as Prisma.InputJsonValue } });
    });
    return NextResponse.json({ id: plan.id }, { status: 201 });
  } catch (error) {
    console.error("admin_plan_create_error", error);
    return NextResponse.json({ error: "Could not create plan. Check that the plan name is unique." }, { status: 409 });
  }
}
