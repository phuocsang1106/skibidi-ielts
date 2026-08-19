import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/db";
import { getOperationalPlanForUser } from "@/lib/services/plans";

const schema = z.object({ wordId: z.string().min(1), status: z.enum(["NOT_STARTED", "LEARNING", "LEARNED"]) });

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return NextResponse.json({ message: "Invalid origin" }, { status: 403 }); }
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Invalid progress update" }, { status: 400 });
  const word = await prisma.vocabularyWord.findUnique({ where: { id: parsed.data.wordId }, include: { topic: { include: { level: true } } } });
  if (!word || !word.isActive) return NextResponse.json({ message: "Word not found" }, { status: 404 });
  const { features } = await getOperationalPlanForUser(user.id);
  if (word.topic.level.requiredFeature && !features.includes(word.topic.level.requiredFeature)) return NextResponse.json({ message: "This level is not included in your plan." }, { status: 403 });
  if (word.topic.requiredFeature && !features.includes(word.topic.requiredFeature)) return NextResponse.json({ message: "This topic is not included in your plan." }, { status: 403 });
  await prisma.userVocabularyProgress.upsert({ where: { userId_wordId: { userId: user.id, wordId: word.id } }, update: { status: parsed.data.status }, create: { userId: user.id, wordId: word.id, status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
