import { NextResponse } from "next/server";
import { getCurrentAdmin, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await setSession(user.id, "user", { impersonatedBy: admin.id });
  return NextResponse.json({ ok: true, username: user.username });
}
