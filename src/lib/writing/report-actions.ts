"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const categories = new Set(["BAND_SCORE_INACCURATE", "FEEDBACK_INCORRECT", "QUESTION_MISUNDERSTOOD", "IMAGE_UNREADABLE", "OTHER"]);

export async function createWritingReportAction(formData: FormData) {
  const user = await requireUser();
  const writingSubmissionId = String(formData.get("writingSubmissionId") || "");
  const category = String(formData.get("category") || "");
  const message = String(formData.get("message") || "").trim().slice(0, 2000);
  if (!categories.has(category)) return;
  const submission = await prisma.writingSubmission.findFirst({ where: { id: writingSubmissionId, userId: user.id }, select: { id: true } });
  if (!submission) return;
  await prisma.userReport.create({ data: { userId: user.id, writingSubmissionId, category: category as never, message: message || null } });
  revalidatePath(`/app/history/${writingSubmissionId}`);
}
