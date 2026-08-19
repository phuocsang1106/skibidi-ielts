import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";
import { setSession } from "@/lib/auth";
import { assertRateLimit, clientAddress } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid username or password." }, { status: 400 });

    await assertRateLimit("login", `${clientAddress(request.headers)}:${parsed.data.username.toLowerCase()}`, 10, 15 * 60);
    const user = await prisma.user.findUnique({ where: { username: parsed.data.username.toLowerCase() } });
    const valid = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });

    await setSession(user.id, "user");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    console.error("login_error", error);
    return NextResponse.json({ error: status === 429 ? "Too many attempts. Try again later." : "Could not sign in." }, { status });
  }
}
