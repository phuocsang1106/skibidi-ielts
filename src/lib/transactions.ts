import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function withSerializableRetry<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (error) {
      lastError = error;
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
      if (code !== "P2034" || i === attempts - 1) throw error;
    }
  }
  throw lastError;
}
