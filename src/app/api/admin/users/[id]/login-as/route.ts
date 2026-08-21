import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  await setSession(user.id, "user");
  return NextResponse.json({ ok: true });
}
