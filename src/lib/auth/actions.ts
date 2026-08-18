"use server";

import argon2 from "argon2";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import {
  assertLoginAllowed,
  clearLoginFailures,
  LoginRateLimitedError,
  recordLoginFailure
} from "@/lib/auth/rate-limit";
import { changePasswordSchema, loginSchema, normalizeUsername, registerSchema } from "@/lib/validation/auth";

export type AuthActionState = { error?: string };

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid registration details." };

  const normalizedUsername = normalizeUsername(parsed.data.username);
  const exists = await prisma.user.findUnique({ where: { normalizedUsername } });
  if (exists) return { error: "That username is already taken." };

  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  const now = new Date();
  let userId = "";
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { username: parsed.data.username.trim(), normalizedUsername, passwordHash }
      });
      await tx.entitlementPeriod.create({
        data: {
          userId: created.id,
          plan: "FREE",
          source: "FREE_CYCLE",
          startAt: now,
          endAt: addDays(now, 30),
          quotaLimit: 3
        }
      });
      return created;
    });
    userId = user.id;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { error: "That username is already taken." };
    }
    throw error;
  }

  await createSession(userId);
  redirect("/app");
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return { error: "Invalid username or password." };

  const normalizedUsername = normalizeUsername(parsed.data.username);
  const rateKey = `${await clientIp()}:${normalizedUsername}`;
  try {
    await assertLoginAllowed(rateKey);
  } catch (error) {
    if (error instanceof LoginRateLimitedError) {
      return { error: `Too many attempts. Try again after ${error.retryAt.toLocaleTimeString()}.` };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { normalizedUsername } });
  const valid = user ? await argon2.verify(user.passwordHash, parsed.data.password) : false;
  if (!user || !valid) {
    await recordLoginFailure(rateKey);
    return { error: "Invalid username or password." };
  }

  await clearLoginFailures(rateKey);
  await createSession(user.id);
  redirect("/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function changePasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid password." };

  const valid = await argon2.verify(user.passwordHash, parsed.data.currentPassword);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  return {};
}
