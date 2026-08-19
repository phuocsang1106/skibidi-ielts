import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { credentialsSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { assertRateLimit, clientAddress } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const parsed = credentialsSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid admin credentials." }, { status: 400 });
    await assertRateLimit("admin-login", `${clientAddress(request.headers)}:${parsed.data.username.toLowerCase()}`, 8, 30 * 60);
    const admin = await prisma.admin.findUnique({ where: { username: parsed.data.username.toLowerCase() } });
    const valid = admin ? await bcrypt.compare(parsed.data.password, admin.passwordHash) : false;
    if (!admin || !valid) return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    await setSession(admin.id, "admin");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    console.error("admin_login_error", error);
    return NextResponse.json({ error: status === 429 ? "Too many attempts. Try again later." : "Could not sign in." }, { status });
  }
}
