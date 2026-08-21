import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const USER_COOKIE = "skibidi_session";
const ADMIN_COOKIE = "skibidi_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionRole = "user" | "admin";
type SessionOptions = { impersonatedBy?: string };
type SessionData = { subject: string; impersonatedBy?: string };

function secretFor(role: SessionRole) {
  const value = role === "admin" ? process.env.ADMIN_SESSION_SECRET : process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(`${role === "admin" ? "ADMIN_SESSION_SECRET" : "SESSION_SECRET"} must be at least 32 characters.`);
  }
  return new TextEncoder().encode(value);
}

export async function setSession(subject: string, role: SessionRole, options: SessionOptions = {}) {
  const payload: { role: SessionRole; impersonatedBy?: string } = { role };
  if (role === "user" && options.impersonatedBy) payload.impersonatedBy = options.impersonatedBy;

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretFor(role));

  const store = await cookies();
  store.set(role === "admin" ? ADMIN_COOKIE : USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS
  });
}

export async function clearSession(role: SessionRole) {
  const store = await cookies();
  store.set(role === "admin" ? ADMIN_COOKIE : USER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

async function readSession(role: SessionRole): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(role === "admin" ? ADMIN_COOKIE : USER_COOKIE)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secretFor(role));
    if (verified.payload.role !== role || !verified.payload.sub) return null;
    return {
      subject: verified.payload.sub,
      impersonatedBy: typeof verified.payload.impersonatedBy === "string" ? verified.payload.impersonatedBy : undefined
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await readSession("user");
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.subject },
    include: { plan: true }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentAdmin() {
  const session = await readSession("admin");
  if (!session) return null;
  return prisma.admin.findUnique({ where: { id: session.subject } });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function getCurrentImpersonatingAdmin() {
  const [userSession, adminSession] = await Promise.all([readSession("user"), readSession("admin")]);
  if (!userSession?.impersonatedBy || !adminSession || userSession.impersonatedBy !== adminSession.subject) return null;
  return prisma.admin.findUnique({ where: { id: adminSession.subject }, select: { id: true, username: true } });
}
