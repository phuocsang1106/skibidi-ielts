import { prisma } from "@/lib/db/prisma";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 10 * 60 * 1000;

export class WritingRateLimitedError extends Error {
  constructor(public readonly retryAt: Date) {
    super("Too many grading attempts.");
  }
}

export async function consumeGradingAttempt(userId: string) {
  const key = `writing:${userId}`;
  const now = new Date();
  const entry = await prisma.aiRateLimit.findUnique({ where: { key } });
  if (entry?.blockedUntil && entry.blockedUntil > now) throw new WritingRateLimitedError(entry.blockedUntil);

  if (!entry || now.getTime() - entry.windowStart.getTime() > WINDOW_MS) {
    await prisma.aiRateLimit.upsert({
      where: { key },
      create: { key, attempts: 1, windowStart: now },
      update: { attempts: 1, windowStart: now, blockedUntil: null }
    });
    return;
  }

  const attempts = entry.attempts + 1;
  await prisma.aiRateLimit.update({
    where: { key },
    data: { attempts, blockedUntil: attempts > MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null }
  });
  if (attempts > MAX_ATTEMPTS) throw new WritingRateLimitedError(new Date(now.getTime() + BLOCK_MS));
}
