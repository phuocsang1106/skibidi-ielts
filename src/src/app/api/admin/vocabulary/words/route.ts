import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const topicId = request.nextUrl.searchParams.get("topicId");
  if (!topicId) return NextResponse.json({ error: "topicId is required." }, { status: 400 });
  const words = await prisma.vocabularyWord.findMany({ where: { topicId }, orderBy: { word: "asc" }, take: 1000 });
  return NextResponse.json({ words });
}
