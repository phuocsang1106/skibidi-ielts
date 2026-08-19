import { Bot, Coins, CreditCard, FileCheck2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

export default async function AdminDashboard() {
  const now = new Date();
  const [totalUsers, activeSubscriptions, usage, submissions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { planExpireDate: { gt: now }, plan: { isFree: false } } }),
    prisma.aIUsage.aggregate({ _sum: { requestCount: true } }),
    prisma.writingSubmission.count()
  ]);
  const stats = [
    [Users, "Total users", String(totalUsers), "Registered accounts"],
    [CreditCard, "Active subscriptions", String(activeSubscriptions), "Paid plans not expired"],
    [Bot, "AI requests used", String(usage._sum.requestCount ?? 0), `${submissions} graded submissions`],
    [Coins, "Revenue", formatPrice(0), "No payment provider connected"]
  ] as const;
  return <div className="space-y-8"><PageHeader eyebrow="Admin overview" title="Dashboard" description="Operational view of users, subscriptions, AI usage, content, and platform configuration." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([Icon, label, value, meta]) => <Card key={label} className="p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><Icon className="h-5 w-5" /></span><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-slate-400">{meta}</p></Card>)}</div><Card className="p-6"><div className="flex gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 text-slate-400" /><div><h2 className="font-semibold">Production note</h2><p className="mt-1 text-sm leading-6 text-slate-500">Revenue remains zero until you connect a payment provider. Plan assignment and promo redemption are fully implemented; payment confirmation should call the same subscription update logic after a verified webhook.</p></div></div></Card></div>;
}
