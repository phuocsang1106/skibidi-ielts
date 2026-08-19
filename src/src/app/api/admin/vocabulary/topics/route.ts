import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ name: z.string().trim().min(2).max(100), groupId: z.string().min(1) });
export async function POST(request: NextRequest) { if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid topic." }, { status: 400 }); try { const topic = await prisma.vocabularyTopic.create({ data: parsed.data }); return NextResponse.json({ id: topic.id }, { status: 201 }); } catch { return NextResponse.json({ error: "Could not create topic. Check group and duplicate names." }, { status: 409 }); } }
