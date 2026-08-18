import { prisma } from "@/lib/db/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export class LoginRateLimitedError extends Error {
  constructor(public readonly retryAt: Date) {
    super("Too many login attempts.");
  }
}

export async function assertLoginAllowed(key: string) {
  const entry = await prisma.loginRateLimit.findUnique({ where: { key } });
  if (entry?.blockedUntil && entry.blockedUntil > new Date()) {
    throw new LoginRateLimitedError(entry.blockedUntil);
  }
}

export async function recordLoginFailure(key: string) {
  const now = new Date();
  const entry = await prisma.loginRateLimit.findUnique({ where: { key } });

  if (!entry || now.getTime() - entry.windowStart.getTime() > WINDOW_MS) {
    await prisma.loginRateLimit.upsert({
      where: { key },
      create: { key, attempts: 1, windowStart: now },
      update: { attempts: 1, windowStart: now, blockedUntil: null }
    });
    return;
  }

  const attempts = entry.attempts + 1;
  await prisma.loginRateLimit.update({
    where: { key },
    data: {
      attempts,
      blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null
    }
  });
}

export async function clearLoginFailures(key: string) {
  await prisma.loginRateLimit.deleteMany({ where: { key } });
}
