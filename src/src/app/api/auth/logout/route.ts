import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  await clearSession("user");
  return NextResponse.json({ ok: true });
}
