import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { setSession } from "@/lib/auth";
import { assertRateLimit, clientAddress } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    await assertRateLimit("register", clientAddress(request.headers), 8, 15 * 60);
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });

    const username = parsed.data.username.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Username is already taken." }, { status: 409 });

    const freePlan = await prisma.plan.findFirst({ where: { isFree: true, isVisible: true }, orderBy: { createdAt: "asc" } });
    if (!freePlan) return NextResponse.json({ error: "Free plan is not configured." }, { status: 503 });

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        planId: freePlan.id,
        planStartedAt: new Date(),
        planExpireDate: null
      },
      select: { id: true }
    });

    await setSession(user.id, "user");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    console.error("register_error", error);
    return NextResponse.json({ error: status === 429 ? "Too many attempts. Try again later." : "Could not create account." }, { status });
  }
}
