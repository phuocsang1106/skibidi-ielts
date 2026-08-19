import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeWriting } from "@/lib/openrouter";
import { parsePlanFeatures } from "@/lib/plan-features";
import { validateFileSignature, validateUpload, writingEssaySchema, writingPromptSchema } from "@/lib/validation";

export const runtime = "nodejs";

async function reserveUsage(userId: string, planStartedAt: Date, limit: number) {
  return prisma.$transaction(async (tx) => {
    const aggregate = await tx.aIUsage.aggregate({ where: { userId, date: { gte: planStartedAt } }, _sum: { requestCount: true } });
    const used = aggregate._sum.requestCount ?? 0;
    if (used >= limit) {
      const error = new Error("Writing submission limit reached.");
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
  if (contentLength > 6 * 1024 * 1024) return NextResponse.json({ error: "File hoặc nội dung gửi lên quá lớn." }, { status: 413 });
  if (user.planExpireDate && user.planExpireDate.getTime() <= Date.now()) return NextResponse.json({ error: "Gói của bạn đã hết hạn." }, { status: 403 });

  let reservation: { id: string } | null = null;
  try {
    const form = await request.formData();
    const taskType = form.get("taskType");
    if (taskType !== "TASK_1" && taskType !== "TASK_2") return NextResponse.json({ error: "Task type không hợp lệ." }, { status: 400 });

    const promptParsed = writingPromptSchema.safeParse(String(form.get("taskPrompt") ?? ""));
    if (!promptParsed.success) return NextResponse.json({ error: promptParsed.error.issues[0]?.message ?? "Đề bài không hợp lệ." }, { status: 400 });
    const essayParsed = writingEssaySchema.safeParse(String(form.get("essay") ?? ""));
    if (!essayParsed.success) return NextResponse.json({ error: essayParsed.error.issues[0]?.message ?? "Bài làm không hợp lệ." }, { status: 400 });

    let taskFile: { name: string; type: string; dataUrl: string } | undefined;
    let promptAttachmentName: string | null = null;
    const file = form.get("promptFile");
    if (file instanceof File && file.size > 0) {
      const fileError = validateUpload(file);
      if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!validateFileSignature(buffer, file.type)) return NextResponse.json({ error: "Nội dung file không khớp định dạng." }, { status: 400 });
      taskFile = { name: file.name, type: file.type, dataUrl: `data:${file.type};base64,${buffer.toString("base64")}` };
      promptAttachmentName = file.name.slice(0, 255);
    }

    const taskPrompt = promptParsed.data.trim();
    if (!taskPrompt && !taskFile) return NextResponse.json({ error: "Hãy nhập đề bài hoặc tải ảnh/PDF của đề." }, { status: 400 });

    reservation = await reserveUsage(user.id, user.planStartedAt, user.plan.aiRequestLimit);
    const features = parsePlanFeatures(user.plan.features);
    const setting = await prisma.aISetting.findUnique({ where: { id: "default" } });
    const model = user.plan.aiModel || setting?.defaultModel;
    if (!model) throw new Error("No OpenRouter model is configured for this plan.");

    const feedback = await gradeWriting({
      taskType,
      taskPrompt: taskPrompt || undefined,
      responseText: essayParsed.data,
      taskFile,
      features,
      model
    });
    const feedbackJson = JSON.parse(JSON.stringify(feedback)) as Prisma.InputJsonValue;
    const submission = await prisma.writingSubmission.create({
      data: {
        userId: user.id,
        taskType,
        taskPrompt: taskPrompt || null,
        promptAttachmentName,
        input: essayParsed.data,
        imageUrl: null,
        attachmentName: promptAttachmentName,
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
    return NextResponse.json({ error: status === 429 ? "Bạn đã hết lượt chấm Writing trong kỳ hiện tại." : "Không thể chấm bài lúc này. Vui lòng thử lại sau." }, { status });
  }
}
