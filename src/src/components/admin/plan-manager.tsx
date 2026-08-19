"use client";

import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { PlanFeatures } from "@/types/feedback";

export type AdminPlan = { id: string; name: string; price: string; durationDays: number; aiRequestLimit: number; aiModel: string; isVisible: boolean; isFree: boolean; features: PlanFeatures };
const featureLabels: Array<[keyof PlanFeatures, string]> = [["bandScore", "Band score"], ["criteria", "4 IELTS criteria"], ["errorCorrection", "Error correction"], ["band7Sample", "Band 7 sample"], ["improvedEssay", "Full improved essay"], ["nextBandGuidance", "Next-band guidance"]];
const emptyFeatures: PlanFeatures = { bandScore: true, criteria: true, errorCorrection: false, band7Sample: false, improvedEssay: false, nextBandGuidance: false };

function PlanEditor({ plan, onChanged }: { plan?: AdminPlan; onChanged: () => void }) {
  const [value, setValue] = useState({ name: plan?.name ?? "", price: plan?.price ?? "0", durationDays: plan?.durationDays ?? 30, aiRequestLimit: plan?.aiRequestLimit ?? 1, aiModel: plan?.aiModel ?? "openrouter/auto", isVisible: plan?.isVisible ?? true, isFree: plan?.isFree ?? false, features: plan?.features ?? emptyFeatures });
  const [loading, setLoading] = useState(false);
  async function save() {
    setLoading(true);
    try {
      const response = await fetch(plan ? `/api/admin/plans/${plan.id}` : "/api/admin/plans", { method: plan ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...value, price: Number(value.price) }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save plan.");
      toast.success(plan ? "Plan updated." : "Plan created."); onChanged();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save plan."); } finally { setLoading(false); }
  }
  async function remove() {
    if (!plan || !window.confirm(`Delete ${plan.name}? Hiding it is safer if users reference this plan.`)) return;
    setLoading(true);
    try { const response = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" }); const payload = (await response.json()) as { error?: string }; if (!response.ok) throw new Error(payload.error ?? "Could not delete plan."); toast.success("Plan deleted."); onChanged(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete plan."); } finally { setLoading(false); }
  }
  return <Card className="p-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><div className="space-y-2"><Label>Name</Label><Input value={value.name} onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))} /></div><div className="space-y-2"><Label>Price (VND)</Label><Input type="number" min="0" value={value.price} onChange={(e) => setValue((v) => ({ ...v, price: e.target.value }))} /></div><div className="space-y-2"><Label>Duration days</Label><Input type="number" min="1" value={value.durationDays} onChange={(e) => setValue((v) => ({ ...v, durationDays: Number(e.target.value) }))} /></div><div className="space-y-2"><Label>AI requests</Label><Input type="number" min="0" value={value.aiRequestLimit} onChange={(e) => setValue((v) => ({ ...v, aiRequestLimit: Number(e.target.value) }))} /></div><div className="space-y-2"><Label>OpenRouter model</Label><Input value={value.aiModel} onChange={(e) => setValue((v) => ({ ...v, aiModel: e.target.value }))} placeholder="provider/model" /></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{featureLabels.map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={value.features[key]} onChange={(e) => setValue((v) => ({ ...v, features: { ...v.features, [key]: e.target.checked } }))} />{label}</label>)}<label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={value.isVisible} onChange={(e) => setValue((v) => ({ ...v, isVisible: e.target.checked }))} />Visible</label><label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={value.isFree} onChange={(e) => setValue((v) => ({ ...v, isFree: e.target.checked }))} disabled={Boolean(plan?.isFree)} />Free plan</label></div><div className="mt-5 flex gap-2"><Button onClick={save} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : plan ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{plan ? "Save plan" : "Create plan"}</Button>{plan && !plan.isFree && <Button variant="danger" onClick={remove} disabled={loading}><Trash2 className="h-4 w-4" />Delete</Button>}</div></Card>;
}

export function PlanManager({ plans }: { plans: AdminPlan[] }) {
  const [refresh, setRefresh] = useState(0);
  function changed() { setRefresh((x) => x + 1); window.location.reload(); }
  return <div className="space-y-5" key={refresh}><PlanEditor onChanged={changed} />{plans.map((plan) => <PlanEditor key={plan.id} plan={plan} onChanged={changed} />)}</div>;
}
