import Link from "next/link";
import { ArrowRight, BrainCircuit, Check, ChevronRight, Crown, FileCheck2, Layers3, Sparkles, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/landing/logo";
import { Reveal } from "@/components/landing/reveal";
import type { PlanFeatures } from "@/types/feedback";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [plans, user] = await Promise.all([
    prisma.plan.findMany({ where: { isVisible: true }, orderBy: [{ price: "asc" }] }),
    getCurrentUser()
  ]);
  const primaryHref = user ? "/dashboard" : "/register";
  const writingHref = user ? "/dashboard/writing" : "/register?next=/dashboard/writing";

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo href={user ? "/dashboard" : "/"} />
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex" aria-label="Main navigation">
            <Link href="#vocabulary" className="transition hover:text-slate-950">Vocabulary</Link>
            <Link href="#writing" className="transition hover:text-slate-950">Writing AI</Link>
            <Link href="#pricing" className="transition hover:text-slate-950">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/dashboard"><UserRound className="h-4 w-4" />{user.username}</Link></Button>
                <Button asChild><Link href="/dashboard">Dashboard <ArrowRight className="h-4 w-4" /></Link></Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Login</Link></Button>
                <Button asChild><Link href="/register">Get started <ArrowRight className="h-4 w-4" /></Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b bg-slate-50/70">
          <div className="grid-fade absolute inset-0 opacity-80" />
          <div className="relative mx-auto max-w-7xl px-5 py-24 text-center sm:py-32 lg:px-8 lg:py-36">
            <Reveal>
              <Badge className="border border-slate-200 bg-white px-3 py-1.5 shadow-sm"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Built for focused IELTS practice</Badge>
              <h1 className="mx-auto mt-7 max-w-4xl text-balance text-4xl font-black tracking-[-0.045em] sm:text-6xl lg:text-7xl">Master IELTS Vocabulary & Writing with AI</h1>
              <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-slate-600 sm:text-lg">Học từ vựng thông minh và cải thiện Writing với AI IELTS Examiner — một workspace gọn, nhanh và tập trung vào tiến bộ thực tế.</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg"><Link href={primaryHref}>{user ? "Open Dashboard" : "Start Learning"} <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href={writingHref}>Try AI Writing Checker</Link></Button>
              </div>
            </Reveal>

            <Reveal delay={0.12} className="mx-auto mt-16 max-w-5xl">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-soft">
                <div className="rounded-[1.25rem] bg-slate-950 p-5 text-left sm:p-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Writing result</p><p className="mt-1 font-semibold text-white">Task 2 · Technology & Education</p></div>
                    <div className="rounded-2xl bg-red-500/15 px-5 py-3 text-center"><p className="text-xs text-red-300">Overall band</p><p className="text-3xl font-black text-red-400">7.5</p></div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {['Task Response', 'Coherence', 'Lexical Resource', 'Grammar'].map((item, index) => <div key={item} className="rounded-xl bg-white/5 p-4"><p className="text-xs text-slate-400">{item}</p><p className="mt-2 text-xl font-bold text-white">{[7.5, 7, 8, 7.5][index]}</p></div>)}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="vocabulary" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge>Vocabulary learning</Badge>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Flashcards that keep the signal, remove the noise.</h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-600">Học theo Group → Topic → Word. Mỗi card tập trung vào word, meaning, example, giải thích tiếng Việt và synonyms khi cần.</p>
              <div className="mt-7 space-y-3 text-sm text-slate-700">
                {["Smooth 3D flip animation", "Topic-based vocabulary structure", "Responsive touch-friendly cards"].map((text) => <p key={text} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check className="h-3.5 w-3.5" /></span>{text}</p>)}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -left-5 -top-5 h-full w-full rounded-3xl bg-slate-100" />
              <Card className="relative min-h-80 p-8 shadow-soft">
                <div className="flex items-center justify-between"><Badge>Environment</Badge><Layers3 className="h-5 w-5 text-slate-400" /></div>
                <p className="mt-16 text-center text-4xl font-black tracking-tight">sustainable</p>
                <p className="mt-3 text-center text-sm text-slate-400">Tap to flip</p>
                <div className="mt-16 flex justify-between text-xs font-medium text-slate-400"><span>12 / 36 words</span><span>Academic Vocabulary</span></div>
              </Card>
            </div>
          </Reveal>
        </section>

        <section id="writing" className="border-y bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
            <Reveal className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-1"><Badge>AI Writing Correction</Badge><h2 className="mt-5 text-3xl font-bold tracking-tight">Feedback structured like an examiner report.</h2><p className="mt-4 leading-7 text-slate-600">Nhập đề bài riêng, dán bài làm và nhận feedback theo 4 tiêu chí IELTS bằng tiếng Việt.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                {[[BrainCircuit, "Band + 4 criteria", "Band tổng màu đỏ nổi bật, kèm breakdown rõ ràng cho từng tiêu chí."], [FileCheck2, "Corrections & samples", "Sửa lỗi, bài mẫu và hướng dẫn tăng band được mở theo từng gói."]].map(([Icon, title, description]) => {
                  const I = Icon as typeof BrainCircuit;
                  return <Card key={String(title)} className="p-7"><span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white"><I className="h-5 w-5" /></span><h3 className="mt-6 font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{String(description)}</p></Card>;
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center"><Badge>Simple pricing</Badge><h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Choose your Writing plan.</h2></div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
              {plans.map((plan) => {
                const feature = plan.features as unknown as PlanFeatures;
                const name = plan.name.toLowerCase();
                const isPro = name === "pro";
                const isMax = name === "max" || name === "premium";
                const isPlus = name === "plus";
                return (
                  <Card key={plan.id} className={`relative flex flex-col overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-xl ${isPro ? "border-slate-950 bg-slate-950 text-white shadow-2xl xl:-translate-y-3" : isMax ? "border-amber-300 bg-gradient-to-b from-amber-50 to-white shadow-lg" : isPlus ? "border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-white shadow-md" : ""}`}>
                    {isPro && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400" />}
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2">{isMax && <Crown className="h-5 w-5 text-amber-600" />}<h3 className="text-lg font-black">{plan.name}</h3></div>{isPro && <Badge className="bg-white text-slate-950">Popular</Badge>}</div>
                    <p className="mt-6 text-3xl font-black tracking-tight">{formatPrice(plan.price.toString())}</p>
                    <p className={`mt-1 text-xs ${isPro ? "text-slate-400" : "text-slate-500"}`}>{plan.isFree ? "Free" : `${plan.durationDays} days`}</p>
                    <div className={`my-6 h-px ${isPro ? "bg-white/10" : "bg-slate-100"}`} />
                    <div className={`space-y-3 text-sm ${isPro ? "text-slate-200" : "text-slate-600"}`}>
                      <p className="flex gap-2"><Check className="h-4 w-4 text-emerald-500" />{plan.aiRequestLimit} lượt chấm Writing</p>
                      {feature.bandScore && <p className="flex gap-2"><Check className="h-4 w-4 text-emerald-500" />Overall band score</p>}
                      {feature.criteria && <p className="flex gap-2"><Check className="h-4 w-4 text-emerald-500" />4 IELTS criteria</p>}
                      {feature.errorCorrection && <p className="flex gap-2"><Check className="h-4 w-4 text-emerald-500" />Error correction</p>}
                      {feature.band7Sample && <p className="flex gap-2"><Check className="h-4 w-4 text-emerald-500" />Band 7 sample</p>}
                      {feature.improvedEssay && <p className="flex gap-2"><Check className="h-4 w-4 text-emerald-500" />Improved essay</p>}
                      {feature.nextBandGuidance && <p className="flex gap-2"><Check className="h-4 w-4 text-emerald-500" />Next-band guidance</p>}
                    </div>
                    <Button asChild className={`mt-8 w-full ${isPro ? "bg-white text-slate-950 hover:bg-slate-100" : ""}`} variant={isPro ? "default" : "outline"}><Link href={user ? "/dashboard/pricing" : "/register"}>{user ? "Choose plan" : `Get ${plan.name}`}<ChevronRight className="h-4 w-4" /></Link></Button>
                  </Card>
                );
              })}
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
