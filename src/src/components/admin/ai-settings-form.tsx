"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AISettingsForm({ defaultModel, hasStoredKey, hasEnvKey }: { defaultModel: string; hasStoredKey: boolean; hasEnvKey: boolean }) {
  const [model, setModel] = useState(defaultModel);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);
    try {
      const response = await fetch("/api/admin/ai-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defaultModel: model, apiKey: apiKey || undefined }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save AI settings.");
      setApiKey(""); toast.success("AI settings saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save AI settings."); } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="space-y-5"><Card className="p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">OpenRouter API</h2><p className="mt-1 text-sm text-slate-500">API key is never returned to the browser after saving.</p></div><Badge className={hasStoredKey || hasEnvKey ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}>{hasStoredKey ? "Encrypted DB key" : hasEnvKey ? "Environment key" : "Not configured"}</Badge></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="defaultModel">Global fallback model</Label><Input id="defaultModel" value={model} onChange={(e) => setModel(e.target.value)} placeholder="openrouter/auto" /><p className="text-xs text-slate-400">Each plan can override this with its own OpenRouter model slug.</p></div><div className="space-y-2"><Label htmlFor="apiKey">Replace API key</Label><Input id="apiKey" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-or-v1-..." /><p className="text-xs text-slate-400">Leave blank to keep the current key. Stored keys use AES-256-GCM.</p></div></div></Card><Card className="p-6"><h2 className="font-semibold">Common model families</h2><p className="mt-1 text-sm text-slate-500">Use the exact current OpenRouter model slug in each Plan. Examples of provider namespaces:</p><div className="mt-4 flex flex-wrap gap-2">{["google/... (Gemini)", "openai/... (ChatGPT)", "deepseek/...", "anthropic/...", "meta-llama/..."].map((item) => <Badge key={item}>{item}</Badge>)}</div><p className="mt-4 text-xs leading-5 text-slate-400">Image grading requires the selected model/provider endpoint to support image input. PDFs can be parsed through OpenRouter even when the downstream model lacks native file input.</p></Card><Button size="lg" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save AI settings</Button></form>;
}
