import { prisma } from "@/lib/db";
import { keyedSha256 } from "@/lib/security";
import { withSerializableRetry } from "@/lib/transactions";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

function rateKey(ip: string, normalizedUsername: string) {
  return keyedSha256(`login:${ip}:${normalizedUsername}`);
}

export async function assertLoginAllowed(ip: string, normalizedUsername: string) {
  const key = rateKey(ip, normalizedUsername);
  const record = await prisma.loginRateLimit.findUnique({ where: { key } });
  if (!record) return;
  if (record.blockedUntil && record.blockedUntil > new Date()) {
    throw new Error("LOGIN_RATE_LIMITED");
  }
}

export async function recordLoginFailure(ip: string, normalizedUsername: string, userId?: string) {
  const key = rateKey(ip, normalizedUsername);
  const now = new Date();
  await withSerializableRetry(async (tx) => {
    const current = await tx.loginRateLimit.findUnique({ where: { key } });
    if (!current || now.getTime() - current.windowStart.getTime() > WINDOW_MS) {
      await tx.loginRateLimit.upsert({
        where: { key },
        update: { attemptCount: 1, windowStart: now, blockedUntil: null, userId: userId || null },
        create: { key, attemptCount: 1, windowStart: now, userId: userId || null }
      });
      return;
    }
    const attempts = current.attemptCount + 1;
    await tx.loginRateLimit.update({
      where: { key },
      data: {
        attemptCount: attempts,
        userId: userId || current.userId,
        blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : current.blockedUntil
      }
    });
  });
}

export async function clearLoginFailures(ip: string, normalizedUsername: string) {
  await prisma.loginRateLimit.deleteMany({ where: { key: rateKey(ip, normalizedUsername) } });
}
