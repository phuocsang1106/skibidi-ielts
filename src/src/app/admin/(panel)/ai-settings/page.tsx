import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { AISettingsForm } from "@/components/admin/ai-settings-form";

export default async function AISettingsPage() {
  const setting = await prisma.aISetting.findUnique({ where: { id: "default" } });
  return <div className="space-y-8"><PageHeader eyebrow="AI configuration" title="OpenRouter settings" description="Configure the fallback model and API credential. Plan-level model settings take precedence during grading." /><AISettingsForm defaultModel={setting?.defaultModel ?? "openrouter/auto"} hasStoredKey={Boolean(setting?.encryptedApiKey)} hasEnvKey={Boolean(process.env.OPENROUTER_API_KEY)} /></div>;
}
