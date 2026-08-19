import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { assertSameOrigin, requestIp } from "@/lib/security";
import { normalizeUsername } from "@/lib/utils";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/rate-limit";

function errorRedirect(request: Request, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return errorRedirect(request, "Invalid request origin."); }
  const form = await request.formData();
  const username = String(form.get("username") || "");
  const password = String(form.get("password") || "");
  const normalizedUsername = normalizeUsername(username);
  const ip = requestIp(request.headers);
  try { await assertLoginAllowed(ip, normalizedUsername); } catch { return errorRedirect(request, "Too many login attempts. Try again later."); }
  const user = await prisma.user.findUnique({ where: { normalizedUsername } });
  const valid = user ? await compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    await recordLoginFailure(ip, normalizedUsername, user?.id);
    return errorRedirect(request, "Invalid username or password.");
  }
  await clearLoginFailures(ip, normalizedUsername);
  await createSession(user.id);
  return NextResponse.redirect(new URL(user.role === "ADMIN" ? "/admin" : "/app/dashboard", request.url), 303);
}
