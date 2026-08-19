import Link from "next/link";
import { Brand } from "@/components/brand";
import { listPublicPlans } from "@/lib/services/plans";
import { formatVnd } from "@/lib/utils";
import { featureLabel } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await listPublicPlans();
  return <div className="min-h-screen bg-[#fafaf8]"><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-7"><Brand/><nav className="flex items-center gap-5 text-sm font-medium"><Link href="/pricing">Pricing</Link><Link href="/login">Log in</Link></nav></header><main className="mx-auto max-w-6xl px-5 py-16 sm:px-7"><div className="max-w-2xl"><h1 className="text-4xl font-semibold tracking-tight">Pricing</h1><p className="mt-3 text-zinc-600">Plans are configured by the Skibidi IELTS admin. Existing subscriptions keep their purchased quota and feature snapshot if prices change later.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{plans.map((plan)=><article className="surface flex flex-col p-6" key={plan.id}><div className="flex items-start justify-between gap-4"><h2 className="text-xl font-semibold">{plan.displayName}</h2>{plan.badge&&<span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{plan.badge}</span>}</div><p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">{plan.description}</p><div className="mt-5 text-3xl font-semibold">{formatVnd(plan.priceVnd)}</div><div className="mt-2 text-sm text-zinc-500">{plan.durationDays ? `${plan.durationDays} days` : "No fixed duration"} · {plan.submissionLimit} submissions</div><ul className="mt-5 space-y-2 text-sm text-zinc-700">{plan.features.slice(0,6).map((f)=><li key={f}>✓ {featureLabel(f)}</li>)}</ul><Link href={plan.priceVnd===0?"/register":"/login"} className="btn btn-primary mt-7">{plan.priceVnd===0?"Get started":"Log in to purchase"}</Link></article>)}</div></main></div>;
}
