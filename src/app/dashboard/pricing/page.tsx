import { Check, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePlanFeatures } from "@/lib/plan-features";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PromoForm } from "@/components/dashboard/promo-form";

export default async function PricingPage() {
  const user = await requireUser();
  const plans = await prisma.plan.findMany({ where: { isVisible: true }, orderBy: { price: "asc" } });
  return <div className="space-y-8"><PageHeader eyebrow="Subscription" title="Pricing" description="Every paid subscription period uses the duration configured by admin. AI model and feedback depth can differ by plan." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.map((plan) => { const features = parsePlanFeatures(plan.features); const active = plan.id === user.planId; return <Card key={plan.id} className={`flex flex-col p-6 ${active ? "border-slate-950 ring-1 ring-slate-950" : ""}`}><div className="flex items-center justify-between"><h2 className="font-bold">{plan.name}</h2>{active && <Badge className="bg-slate-950 text-white">Current</Badge>}</div><p className="mt-5 text-2xl font-black">{formatPrice(plan.price.toString())}</p><p className="mt-1 text-xs text-slate-400">{plan.isFree ? "Starter plan" : `${plan.durationDays} days`}</p><div className="my-5 h-px bg-slate-100" /><div className="space-y-3 text-sm text-slate-600">{[`${plan.aiRequestLimit} AI request(s)`, features.bandScore && "Overall band score", features.criteria && "4 IELTS criteria", features.errorCorrection && "Error correction", features.band7Sample && "Band 7 sample", features.improvedEssay && "Full improved essay", features.nextBandGuidance && "Next-band guidance"].filter(Boolean).map((label) => <p key={String(label)} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{label}</p>)}</div><p className="mt-auto pt-6 text-xs text-slate-400">Model: <span className="font-mono">{plan.aiModel}</span></p></Card>; })}</div><Card className="p-6"><div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" /><div><h2 className="font-semibold">Upgrade access</h2><p className="mt-1 text-sm leading-6 text-slate-500">No payment gateway was specified for this build, so paid access is activated by admin plan assignment or a promo code. Add Stripe/PayOS/MoMo later without changing the plan/quota model.</p></div></div><div className="mt-5 max-w-xl"><PromoForm /></div></Card></div>;
}
