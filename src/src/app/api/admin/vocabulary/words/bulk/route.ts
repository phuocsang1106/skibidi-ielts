import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ topicId: z.string().min(1), words: z.string().min(1).max(30000) });

export async function POST(request: NextRequest) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid bulk vocabulary input." }, { status: 400 });
  const topic = await prisma.vocabularyTopic.findUnique({ where: { id: parsed.data.topicId }, select: { id: true } });
  if (!topic) return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  const words = [...new Set(parsed.data.words.split(/\r?\n/).map((word) => word.trim()).filter(Boolean))].slice(0, 500);
  if (!words.length) return NextResponse.json({ error: "No vocabulary words found." }, { status: 400 });
  const result = await prisma.vocabularyWord.createMany({ data: words.map((word) => ({ topicId: topic.id, word })), skipDuplicates: true });
  return NextResponse.json({ created: result.count });
}
