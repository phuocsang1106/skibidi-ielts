import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminPageHeader, StatCard, StatusPill } from "@/components/admin/ui";

export default async function AdminDashboardPage() {
  const now = new Date();
  const today = new Date(now); today.setHours(0,0,0,0);
  const [users, activeSubscriptions, payments, writingsToday, gradingFailures, reports, recentPayments, recentFailures] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE", startsAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
    prisma.paymentOrder.count({ where: { status: "TRANSFER_REPORTED" } }),
    prisma.writingSubmission.count({ where: { createdAt: { gte: today } } }),
    prisma.aiCallLog.count({ where: { status: "FAILURE", createdAt: { gte: today } } }),
    prisma.problemReport.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.paymentOrder.findMany({ where: { status: "TRANSFER_REPORTED" }, orderBy: { transferReportedAt: "asc" }, take: 5, include: { user: { select: { username: true } } } }),
    prisma.aiCallLog.findMany({ where: { status: "FAILURE" }, orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { username: true } }, plan: { select: { displayName: true } } } })
  ]);
  return <div>
    <AdminPageHeader title="Dashboard" description="Operational signals only: users, live entitlements, manual payment review, Writing throughput, grading failures and user reports."/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total users" value={users}/><StatCard label="Active subscriptions" value={activeSubscriptions}/><StatCard label="Payments awaiting review" value={payments}/>
      <StatCard label="Writing submissions today" value={writingsToday}/><StatCard label="Grading failures today" value={gradingFailures}/><StatCard label="Reports awaiting review" value={reports}/>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <section className="surface p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Payment queue</h2><Link className="text-sm font-semibold" href="/admin/payments">Open payments →</Link></div>{recentPayments.length?<div className="mt-4 divide-y divide-zinc-100">{recentPayments.map(p=><div key={p.id} className="flex items-center gap-3 py-3 first:pt-0"><div className="min-w-0 flex-1"><div className="text-sm font-medium">{p.user.username} · {p.planNameSnapshot}</div><div className="text-xs text-zinc-400">{p.transferCode} · {p.amountVnd.toLocaleString("vi-VN")} ₫</div></div><StatusPill value={p.status}/></div>)}</div>:<p className="mt-4 text-sm text-zinc-500">No transfer reports are waiting.</p>}</section>
      <section className="surface p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent AI failures</h2><Link className="text-sm font-semibold" href="/admin/ai">Open AI / Models →</Link></div>{recentFailures.length?<div className="mt-4 divide-y divide-zinc-100">{recentFailures.map(log=><Link href={`/admin/ai/${log.logicalSubmissionId}`} key={log.id} className="block py-3 first:pt-0 hover:bg-zinc-50"><div className="flex items-center gap-2"><span className="text-sm font-medium">{log.user.username}</span><StatusPill value="FAILED"/></div><div className="mt-1 text-xs text-zinc-500">{log.stage} · {log.plan.displayName} · {log.model}</div><div className="mt-1 truncate text-xs text-zinc-400">{log.errorCategory || "UNKNOWN"} {log.sanitizedError ? `· ${log.sanitizedError}` : ""}</div></Link>)}</div>:<p className="mt-4 text-sm text-zinc-500">No grading failures recorded.</p>}</section>
    </div>
  </div>;
}
