import Link from "next/link";
import { ArrowRight, BookOpenText, PenLine, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { listPublicPlans } from "@/lib/services/plans";
import { formatVnd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const plans = await listPublicPlans();
  return <div className="min-h-screen bg-[#fafaf8]">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-7"><Brand/><nav className="flex items-center gap-5 text-sm font-medium"><Link href="/pricing">Pricing</Link><Link href="/login">Log in</Link></nav></header>
    <main>
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-7 sm:pt-32">
        <div className="max-w-3xl"><p className="mb-4 text-sm font-semibold text-blue-600">IELTS learning, built for focused practice</p><h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-6xl">Build the vocabulary. Submit the writing. Know what to fix next.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">Structured IELTS vocabulary for Band 3.5 to 6.5+, plus AI-assisted Writing Task 1 and Task 2 evaluation grounded in the official IELTS Writing descriptors.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="btn btn-primary">Start learning <ArrowRight size={16}/></Link><Link href="/pricing" className="btn btn-secondary">View pricing</Link></div></div>
      </section>
      <section className="border-y border-zinc-200 bg-white"><div className="mx-auto grid max-w-6xl gap-0 px-5 sm:px-7 md:grid-cols-3">{[[BookOpenText,"Vocabulary","Three learner levels with focused topics and flip-card practice."],[PenLine,"AI Writing evaluation","Task 1 multimodal and Task 2 grading with criterion-level feedback."],[ShieldCheck,"Verified feedback","Higher plans can use independent verifier stages before feedback is generated."]].map(([Icon,title,desc])=><div key={String(title)} className="border-b border-zinc-200 py-8 md:border-b-0 md:border-r md:px-8 first:md:pl-0 last:md:border-r-0"><Icon size={20} className="mb-4 text-blue-600"/><h2 className="font-semibold">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{String(desc)}</p></div>)}</div></section>
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-7"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">Pricing</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Choose your Writing quota</h2></div><Link href="/pricing" className="text-sm font-semibold">All plans →</Link></div><div className="grid gap-4 md:grid-cols-3">{plans.slice(0,3).map((plan)=><article key={plan.id} className="surface p-6"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold">{plan.displayName}</h3>{plan.badge&&<span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{plan.badge}</span>}</div><p className="mt-2 min-h-10 text-sm text-zinc-500">{plan.description}</p><div className="mt-6 text-2xl font-semibold">{formatVnd(plan.priceVnd)}</div><p className="mt-1 text-sm text-zinc-500">{plan.submissionLimit} Writing submissions</p></article>)}</div></section>
    </main>
  </div>;
}
