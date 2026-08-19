import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ word: z.string().trim().min(1).max(120), meaning: z.string().max(3000), example: z.string().max(5000), translation: z.string().max(3000), synonyms: z.string().max(2000) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid vocabulary word." }, { status: 400 });
  const { id } = await params;
  try {
    await prisma.vocabularyWord.update({ where: { id }, data: { word: parsed.data.word, meaning: parsed.data.meaning || null, example: parsed.data.example || null, translation: parsed.data.translation || null, synonyms: parsed.data.synonyms.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update word. A duplicate may already exist in this topic." }, { status: 409 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  await prisma.vocabularyWord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
