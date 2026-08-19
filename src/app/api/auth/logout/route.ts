import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return new NextResponse("Invalid origin", { status: 403 }); }
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
