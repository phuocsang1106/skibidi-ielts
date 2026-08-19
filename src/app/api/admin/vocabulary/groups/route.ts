import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ name: z.string().trim().min(2).max(100) });
export async function POST(request: NextRequest) { if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid group name." }, { status: 400 }); try { const group = await prisma.vocabularyGroup.create({ data: parsed.data }); return NextResponse.json({ id: group.id }, { status: 201 }); } catch { return NextResponse.json({ error: "Group name already exists." }, { status: 409 }); } }
