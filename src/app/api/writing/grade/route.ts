import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeWriting } from "@/lib/openrouter";
import { parsePlanFeatures } from "@/lib/plan-features";
import { validateFileSignature, validateUpload, writingTextSchema } from "@/lib/validation";

export const runtime = "nodejs";

async function reserveUsage(userId: string, planStartedAt: Date, limit: number) {
  return prisma.$transaction(async (tx) => {
    const aggregate = await tx.aIUsage.aggregate({ where: { userId, date: { gte: planStartedAt } }, _sum: { requestCount: true } });
    const used = aggregate._sum.requestCount ?? 0;
    if (used >= limit) {
      const error = new Error("AI request limit reached for this plan period.");
      Object.assign(error, { status: 429 });
      throw error;
    }
    return tx.aIUsage.create({ data: { userId, requestCount: 1, date: new Date() } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 6 * 1024 * 1024) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  if (user.planExpireDate && user.planExpireDate.getTime() <= Date.now()) return NextResponse.json({ error: "Your subscription has expired." }, { status: 403 });

  let reservation: { id: string } | null = null;
  try {
    const form = await request.formData();
    const taskType = form.get("taskType");
    const mode = form.get("mode");
    if (taskType !== "TASK_1" && taskType !== "TASK_2") return NextResponse.json({ error: "Invalid task type." }, { status: 400 });
    if (mode !== "text" && mode !== "file") return NextResponse.json({ error: "Invalid input mode." }, { status: 400 });

    let text: string | undefined;
    let fileInput: { name: string; type: string; dataUrl: string } | undefined;
    let attachmentName: string | null = null;

    if (mode === "text") {
      const parsed = writingTextSchema.safeParse({ taskType, input: form.get("input") });
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid writing text." }, { status: 400 });
      text = parsed.data.input;
    } else {
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Please upload a file." }, { status: 400 });
      const fileError = validateUpload(file);
      if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!validateFileSignature(buffer, file.type)) return NextResponse.json({ error: "File content does not match its declared type." }, { status: 400 });
      fileInput = { name: file.name, type: file.type, dataUrl: `data:${file.type};base64,${buffer.toString("base64")}` };
      attachmentName = file.name.slice(0, 255);
    }

    reservation = await reserveUsage(user.id, user.planStartedAt, user.plan.aiRequestLimit);
    const features = parsePlanFeatures(user.plan.features);
    const setting = await prisma.aISetting.findUnique({ where: { id: "default" } });
    const model = user.plan.aiModel || setting?.defaultModel;
    if (!model) throw new Error("No OpenRouter model is configured for this plan.");

    const feedback = await gradeWriting({ taskType, text, file: fileInput, features, model });
    const feedbackJson = JSON.parse(JSON.stringify(feedback)) as Prisma.InputJsonValue;
    const submission = await prisma.writingSubmission.create({
      data: {
        userId: user.id,
        taskType,
        input: text ?? `[Uploaded file: ${attachmentName ?? "unnamed"}]`,
        imageUrl: null,
        attachmentName,
        bandScore: feedback.overallBand,
        feedback: feedbackJson,
        featuresSnapshot: features as unknown as Prisma.InputJsonValue,
        modelUsed: model
      },
      select: { id: true }
    });

    return NextResponse.json({ submissionId: submission.id });
  } catch (error) {
    if (reservation) await prisma.aIUsage.delete({ where: { id: reservation.id } }).catch(() => undefined);
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    console.error("writing_grade_error", error);
    return NextResponse.json({ error: status === 429 ? "AI request limit reached for this plan period." : "Could not grade the submission. Please try again later." }, { status });
  }
}
