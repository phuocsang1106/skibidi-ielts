"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function setVocabularyLearnedAction(formData: FormData) {
  const user = await requireUser();
  const vocabularyItemId = String(formData.get("vocabularyItemId") || "");
  const learned = formData.get("learned") === "true";
  if (!vocabularyItemId) return;
  const exists = await prisma.vocabularyItem.findUnique({ where: { id: vocabularyItemId }, select: { id: true } });
  if (!exists) return;

  await prisma.vocabularyProgress.upsert({
    where: { userId_vocabularyItemId: { userId: user.id, vocabularyItemId } },
    create: { userId: user.id, vocabularyItemId, learned, learnedAt: learned ? new Date() : null },
    update: { learned, learnedAt: learned ? new Date() : null }
  });
  revalidatePath("/app/vocabulary", "layout");
}
