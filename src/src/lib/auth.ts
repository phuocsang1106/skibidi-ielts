import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const USER_COOKIE = "skibidi_session";
const ADMIN_COOKIE = "skibidi_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secretFor(role: "user" | "admin") {
  const value = role === "admin" ? process.env.ADMIN_SESSION_SECRET : process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(`${role === "admin" ? "ADMIN_SESSION_SECRET" : "SESSION_SECRET"} must be at least 32 characters.`);
  }
  return new TextEncoder().encode(value);
}

export async function setSession(subject: string, role: "user" | "admin") {
  const token = await new SignJWT({ role })
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

export async function clearSession(role: "user" | "admin") {
  const store = await cookies();
  store.set(role === "admin" ? ADMIN_COOKIE : USER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

async function sessionSubject(role: "user" | "admin") {
  const store = await cookies();
  const token = store.get(role === "admin" ? ADMIN_COOKIE : USER_COOKIE)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secretFor(role));
    if (verified.payload.role !== role || !verified.payload.sub) return null;
    return verified.payload.sub;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const id = await sessionSubject("user");
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    include: { plan: true }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentAdmin() {
  const id = await sessionSubject("admin");
  if (!id) return null;
  return prisma.admin.findUnique({ where: { id } });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
