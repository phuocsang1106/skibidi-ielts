import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

const schema = z.object({ defaultModel: z.string().trim().min(3).max(180), apiKey: z.string().trim().min(10).max(500).optional() });

export async function PATCH(request: NextRequest) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid AI settings." }, { status: 400 });
  try {
    const encryptedApiKey = parsed.data.apiKey ? encryptSecret(parsed.data.apiKey) : undefined;
    await prisma.aISetting.upsert({
      where: { id: "default" },
      create: { id: "default", defaultModel: parsed.data.defaultModel, encryptedApiKey: encryptedApiKey ?? null },
      update: { defaultModel: parsed.data.defaultModel, ...(encryptedApiKey ? { encryptedApiKey } : {}) }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ai_settings_error", error);
    return NextResponse.json({ error: "Could not save AI settings. Check CONFIG_ENCRYPTION_KEY." }, { status: 500 });
  }
}
