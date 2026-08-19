import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Gauge, PenLine } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getQuota } from "@/lib/quota";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { parsePlanFeatures } from "@/lib/plan-features";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();
  const [quota, recent] = await Promise.all([
    getQuota(user),
    prisma.writingSubmission.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 })
  ]);

  const stats = [
    [Gauge, "Current plan", user.plan.name, `${user.plan.aiRequestLimit} AI request(s) / period`],
    [PenLine, "Remaining AI", String(quota.remaining), `${quota.used} used`],
    [CalendarDays, "Expiry date", formatDate(user.planExpireDate), user.planExpireDate ? "30-day subscription" : "No paid expiry"]
  ] as const;

  return (
    <div className="space-y-9">
      <PageHeader eyebrow="Overview" title={`Welcome back, ${user.username}`} description="Pick up your vocabulary session or send a Writing response for examiner-style feedback." />
      <section className="grid gap-4 md:grid-cols-3">{stats.map(([Icon, label, value, meta]) => <Card key={label} className="p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><Icon className="h-5 w-5" /></span><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-400">{meta}</p></Card>)}</section>
      <section><h2 className="text-base font-semibold">Quick actions</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Link href="/dashboard/vocabulary" className="group rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BookOpen className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" /></div><h3 className="mt-5 font-semibold">Study vocabulary</h3><p className="mt-2 text-sm text-slate-500">Choose a topic and review with flip cards.</p></Link><Link href="/dashboard/writing" className="group rounded-2xl border bg-slate-950 p-6 text-white transition hover:-translate-y-0.5 hover:shadow-soft"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><PenLine className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" /></div><h3 className="mt-5 font-semibold">Check Writing with AI</h3><p className="mt-2 text-sm text-slate-400">{quota.remaining > 0 ? `${quota.remaining} request(s) remaining.` : "No requests remaining in this period."}</p></Link></div></section>
      <section><div className="flex items-center justify-between"><h2 className="text-base font-semibold">Recent Writing</h2><Button asChild variant="ghost" size="sm"><Link href="/dashboard/history">View all <ArrowRight className="h-4 w-4" /></Link></Button></div><div className="mt-4 overflow-hidden rounded-2xl border bg-white">{recent.length ? recent.map((item) => { const features = parsePlanFeatures(item.featuresSnapshot); return <Link href={`/dashboard/history/${item.id}`} key={item.id} className="flex items-center justify-between border-b px-5 py-4 last:border-0 hover:bg-slate-50"><div><p className="text-sm font-semibold">{item.taskType === "TASK_1" ? "Writing Task 1" : "Writing Task 2"}</p><p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p></div>{features.bandScore ? <Badge className="bg-red-50 text-red-600">Band {item.bandScore.toString()}</Badge> : <span className="text-xs font-medium text-slate-400">Feedback saved</span>}</Link>; }) : <p className="p-6 text-sm text-slate-500">No writing submissions yet.</p>}</div></section>
    </div>
  );
}
