import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export async function assertRateLimit(namespace: string, rawKey: string, limit: number, windowSeconds: number) {
  const key = createHash("sha256").update(`${namespace}:${rawKey}`).digest("hex");
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const bucket = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!existing || existing.resetAt <= now) {
      return tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt }
      });
    }
    return tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  });

  if (bucket.count > limit) {
    const error = new Error("Too many requests. Please try again later.");
    Object.assign(error, { status: 429 });
    throw error;
  }
}

export function clientAddress(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
