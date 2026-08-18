"use server";

import argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { passwordSchema } from "@/lib/validation/auth";
import { confirmPayment, grantPro, rejectPayment, revokePro, setCustomProExpiry } from "@/lib/payments/service";

function value(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
function normalizeWord(word: string) { return word.normalize("NFKC").trim().toLocaleLowerCase("en-US"); }
function slugify(input: string) { return input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function grantProAction(formData: FormData) {
  await requireAdmin(); const userId = value(formData, "userId"); if (!userId) return;
  await grantPro(userId, 30); revalidatePath("/app/admin/users");
}
export async function revokeProAction(formData: FormData) {
  await requireAdmin(); const userId = value(formData, "userId"); if (!userId) return;
  await revokePro(userId); revalidatePath("/app/admin/users");
}
export async function setCustomProExpiryAction(formData: FormData) {
  await requireAdmin(); const userId = value(formData, "userId"); const expiryRaw = value(formData, "expiry"); if (!userId || !expiryRaw) return;
  const expiry = new Date(expiryRaw); if (Number.isNaN(expiry.getTime())) return;
  await setCustomProExpiry(userId, expiry); revalidatePath("/app/admin/users");
}
export async function resetUserPasswordAction(formData: FormData) {
  await requireAdmin(); const userId = value(formData, "userId"); const parsed = passwordSchema.safeParse(value(formData, "newPassword")); if (!userId || !parsed.success) return;
  const passwordHash = await argon2.hash(parsed.data, { type: argon2.argon2id });
  await prisma.$transaction([prisma.user.update({ where: { id: userId }, data: { passwordHash } }), prisma.session.deleteMany({ where: { userId } })]);
  revalidatePath("/app/admin/users");
}
export async function confirmPaymentAction(formData: FormData) {
  const admin = await requireAdmin(); const orderId = value(formData, "orderId"); if (!orderId) return;
  await confirmPayment(orderId, admin.id); revalidatePath("/app/admin/payments");
}
export async function rejectPaymentAction(formData: FormData) {
  const admin = await requireAdmin(); const orderId = value(formData, "orderId"); if (!orderId) return;
  await rejectPayment(orderId, admin.id, value(formData, "reason")); revalidatePath("/app/admin/payments");
}
export async function saveTopicAction(formData: FormData) {
  await requireAdmin();
  const topicId = value(formData, "topicId"); const name = value(formData, "name"); const level = value(formData, "level"); const category = value(formData, "category"); const order = Number(value(formData, "order") || 0);
  if (!name || !["LEVEL_1", "LEVEL_2"].includes(level) || !["CORE", "ADDITIONAL"].includes(category)) return;
  const data = { name, slug: slugify(value(formData, "slug") || name), level: level as "LEVEL_1" | "LEVEL_2", category: category as "CORE" | "ADDITIONAL", order: Number.isFinite(order) ? order : 0 };
  if (topicId) await prisma.vocabularyTopic.update({ where: { id: topicId }, data }); else await prisma.vocabularyTopic.create({ data });
  revalidatePath("/app/admin/vocabulary"); revalidatePath("/app/vocabulary", "layout");
}
export async function deleteTopicAction(formData: FormData) {
  await requireAdmin(); const topicId = value(formData, "topicId"); if (!topicId) return;
  await prisma.vocabularyTopic.delete({ where: { id: topicId } }); revalidatePath("/app/admin/vocabulary"); revalidatePath("/app/vocabulary", "layout");
}
export async function saveVocabularyItemAction(formData: FormData) {
  await requireAdmin();
  const itemId = value(formData, "itemId"); const topicId = value(formData, "topicId"); const word = value(formData, "word"); if (!topicId || !word) return;
  const topic = await prisma.vocabularyTopic.findUniqueOrThrow({ where: { id: topicId } });
  const wordFamily = value(formData, "wordFamily").split(",").map(x => x.trim()).filter(Boolean);
  const collocations = value(formData, "collocations").split(",").map(x => x.trim()).filter(Boolean);
  const data = { topicId, level: topic.level, word, normalizedWord: normalizeWord(word), ipa: value(formData, "ipa"), partOfSpeech: value(formData, "partOfSpeech"), vietnameseMeaning: value(formData, "vietnameseMeaning"), readingDefinition: value(formData, "readingDefinition"), exampleSentence: value(formData, "exampleSentence"), wordFamily, collocations, audioMetadata: { provider: "speechSynthesis", locale: "en-GB" } };
  if (itemId) await prisma.vocabularyItem.update({ where: { id: itemId }, data }); else await prisma.vocabularyItem.create({ data });
  revalidatePath("/app/admin/vocabulary"); revalidatePath("/app/vocabulary", "layout");
}
export async function deleteVocabularyItemAction(formData: FormData) {
  await requireAdmin(); const itemId = value(formData, "itemId"); if (!itemId) return;
  await prisma.vocabularyItem.delete({ where: { id: itemId } }); revalidatePath("/app/admin/vocabulary"); revalidatePath("/app/vocabulary", "layout");
}
export async function updateReportStatusAction(formData: FormData) {
  const admin = await requireAdmin(); const reportId = value(formData, "reportId"); const status = value(formData, "status"); if (!reportId || !["OPEN", "REVIEWED", "RESOLVED"].includes(status)) return;
  await prisma.userReport.update({ where: { id: reportId }, data: { status: status as "OPEN" | "REVIEWED" | "RESOLVED", reviewedByAdminId: admin.id, reviewedAt: new Date() } });
  revalidatePath("/app/admin/reports");
}
