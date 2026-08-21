import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ count: z.number().int().min(1).max(1000) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid count." }, { status: 400 });
  const { id } = await params;
  await prisma.aIUsage.create({ data: { userId: id, requestCount: -parsed.data.count } });
  return NextResponse.json({ ok: true });
}
