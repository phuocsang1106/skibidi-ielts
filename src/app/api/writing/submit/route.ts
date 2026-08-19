import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { submitWriting } from "@/lib/services/writing";
import { toPublicError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ code: "UNAUTHORIZED", message: "Please log in." }, { status: 401 });
    const form = await request.formData();
    const result = await submitWriting(user.id, form, request.signal);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const publicError = toPublicError(error);
    return NextResponse.json({ ok: false, code: publicError.code, message: publicError.message }, { status: publicError.status });
  }
}
