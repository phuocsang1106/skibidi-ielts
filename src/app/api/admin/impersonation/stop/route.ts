import { NextResponse } from "next/server";
import { clearSession, getCurrentImpersonatingAdmin } from "@/lib/auth";

export async function POST() {
  if (!await getCurrentImpersonatingAdmin()) return NextResponse.json({ error: "No active admin impersonation session." }, { status: 409 });
  await clearSession("user");
  return NextResponse.json({ ok: true });
}
