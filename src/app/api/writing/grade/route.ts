import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { gradeWriting, WritingInputError } from "@/lib/writing/service";
import { UploadValidationError } from "@/lib/files/uploads";
import { QuotaExhaustedError } from "@/lib/entitlements/service";
import { WritingRateLimitedError } from "@/lib/writing/rate-limit";

function errorResponse(code: string, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: { code, message, quotaDeducted: false, ...extra } }, { status });
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) throw new Error("INVALID_ORIGIN");

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? new URL(request.url).protocol.replace(":", "");
  const expectedOrigin = `${protocol}://${host}`;

  if (origin !== expectedOrigin) throw new Error("INVALID_ORIGIN");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("UNAUTHORIZED", "Please log in to submit Writing.", 401);

  try {
    assertSameOrigin(request);
    const form = await request.formData();
    const taskType = form.get("taskType");
    if (taskType !== "TASK_1" && taskType !== "TASK_2") {
      return errorResponse("INVALID_TASK", "Choose Writing Task 1 or Task 2.", 400);
    }
    const questionText = typeof form.get("questionText") === "string" ? String(form.get("questionText")) : "";
    const essayText = typeof form.get("essayText") === "string" ? String(form.get("essayText")) : "";
    const q = form.get("questionFile");
    const w = form.get("writingFile");
    const result = await gradeWriting(user.id, {
      taskType,
      questionText,
      essayText,
      questionFile: q instanceof File && q.size > 0 ? q : undefined,
      writingFile: w instanceof File && w.size > 0 ? w : undefined
    });
    return NextResponse.json({ ok: true, submissionId: result.submissionId });
  } catch (error) {
    if (error instanceof UploadValidationError || error instanceof WritingInputError) {
      return errorResponse(error.code, error.message, 400);
    }
    if (error instanceof QuotaExhaustedError) {
      return errorResponse(
        "QUOTA_EXHAUSTED",
        error.plan === "FREE"
          ? "You've used all 3 Writing evaluations for this cycle."
          : "You've used all 10 Writing evaluations for this Pro cycle.",
        429,
        { resetAt: error.resetAt.toISOString(), plan: error.plan }
      );
    }
    if (error instanceof WritingRateLimitedError) {
      return errorResponse("RATE_LIMITED", "Too many grading attempts. Please try again later.", 429, { retryAt: error.retryAt.toISOString() });
    }
    if (error instanceof Error && error.message === "INVALID_ORIGIN") {
      return errorResponse("INVALID_ORIGIN", "This request was rejected for security reasons.", 403);
    }
    console.error("Writing grading failed", error);
    return errorResponse("GRADING_FAILED", "Your essay wasn't graded. Your Writing evaluation has not been deducted. Try again.", 502);
  }
}
