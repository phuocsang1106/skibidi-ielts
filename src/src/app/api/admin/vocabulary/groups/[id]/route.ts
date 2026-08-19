import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema = z.object({ name: z.string().trim().min(2).max(100) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid group name." }, { status: 400 }); const { id } = await params; try { await prisma.vocabularyGroup.update({ where: { id }, data: parsed.data }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Could not update group. Name may already exist." }, { status: 409 }); } }
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) { if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); const { id } = await params; await prisma.vocabularyGroup.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
