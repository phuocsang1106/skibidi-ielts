import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { assertSameOrigin, publicAppUrl } from "@/lib/security";
import { normalizeUsername } from "@/lib/utils";
import { snapshotFromPlan } from "@/lib/services/subscriptions";

function errorRedirect(request: Request, message: string) {
  const url = publicAppUrl("/register", request); url.searchParams.set("error", message); return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return errorRedirect(request, "Invalid request origin."); }
  const form = await request.formData();
  const username = String(form.get("username") || "").trim();
  const normalizedUsername = normalizeUsername(username);
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirmPassword") || "");
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) return errorRedirect(request, "Username must be 3–30 characters using letters, numbers, dot, underscore or dash.");
  if (password.length < 8) return errorRedirect(request, "Password must contain at least 8 characters.");
  if (password !== confirm) return errorRedirect(request, "Passwords do not match.");
  const freePlan = await prisma.plan.findFirst({ where: { isActive: true, priceVnd: 0, visibility: { in: ["PUBLIC", "HIDDEN"] } }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  if (!freePlan) return errorRedirect(request, "Registration is temporarily unavailable because no free plan is configured.");
  try {
    const passwordHash = await hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { username, normalizedUsername, passwordHash } });
      const snap = snapshotFromPlan(freePlan, 0);
      await tx.subscription.create({ data: { userId: created.id, ...snap, source: "FREE", status: "ACTIVE", remainingPlanSubmissions: snap.submissionLimitSnapshot, startsAt: new Date(), expiresAt: snap.durationDaysSnapshot == null ? null : new Date(Date.now() + snap.durationDaysSnapshot * 86400000) } });
      return created;
    });
    await createSession(user.id);
    return NextResponse.redirect(publicAppUrl("/app/dashboard", request), 303);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
    return errorRedirect(request, code === "P2002" ? "That username is already taken." : "Could not create the account. Please try again.");
  }
}
