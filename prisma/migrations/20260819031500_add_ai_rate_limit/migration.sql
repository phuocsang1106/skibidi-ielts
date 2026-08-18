CREATE TABLE IF NOT EXISTS "AiRateLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "requests" INTEGER NOT NULL DEFAULT 0,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "resetAt" TIMESTAMP(3),
  "blockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiRateLimit_pkey" PRIMARY KEY ("key")
);
