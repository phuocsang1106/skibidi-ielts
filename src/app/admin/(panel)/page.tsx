import Link from "next/link";
import { Bot, Coins, CreditCard, Landmark, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const now = new Date();
  const [totalUsers, activeSubscriptions, usage, submissions, revenue, pendingPayments] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { planExpireDate: { gt: now }, plan: { isFree: false } } }),
    prisma.aIUsage.aggregate({ _sum: { requestCount: true } }),
    prisma.writingSubmission.count(),
    prisma.bankPaymentRequest.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.bankPaymentRequest.count({ where: { status: "PENDING" } })
  ]);

  const stats = [
    [Users, "Total users", String(totalUsers), "Registered accounts"],
    [CreditCard, "Active subscriptions", String(activeSubscriptions), "Paid plans active"],
    [Bot, "Writing submissions", String(usage._sum.requestCount ?? 0), `${submissions} graded`],
    [Coins, "Revenue", formatPrice(revenue._sum.amount?.toString() ?? 0), `${pendingPayments} pending payment(s)`]
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin overview" title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([Icon, label, value, meta]) => <Card key={label} className="p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><Icon className="h-5 w-5" /></span><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-slate-400">{meta}</p></Card>)}
      </div>
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Landmark className="h-5 w-5" /></span><div><h2 className="font-semibold">Bank transfer review</h2><p className="text-sm text-slate-500">{pendingPayments} request(s) waiting.</p></div></div>
        <Button asChild><Link href="/admin/payments">Review payments</Link></Button>
      </Card>
    </div>
  );
}
