import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminPageHeader, Section, StatusPill } from "@/components/admin/ui";
import { CreditAdjustmentForm } from "@/components/admin/credit-adjustment-form";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: {
    subscriptions: { orderBy: { createdAt: "desc" }, take: 20 },
    paymentOrders: { orderBy: { createdAt: "desc" }, take: 20 },
    promoRedemptions: { orderBy: { createdAt: "desc" }, take: 20, include: { promoCode: { select: { code: true, rewardType: true } } } },
    creditLedger: { orderBy: { createdAt: "desc" }, take: 30 },
    writingSubmissions: { orderBy: { createdAt: "desc" }, take: 20, include: { result: { select: { overallBand: true } } } }
  } });
  if (!user) notFound();
  const active=user.subscriptions.find(s=>s.status==="ACTIVE");
  return <div><AdminPageHeader title={user.username} description={`User ID ${user.id}`} actions={<Link className="btn btn-secondary" href="/admin/users">Back to users</Link>}/>
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><div className="surface p-5"><div className="text-sm text-zinc-500">Plan</div><div className="mt-2 text-xl font-semibold">{active?.planNameSnapshot||"None"}</div><div className="mt-1 text-xs text-zinc-400">{active?.remainingPlanSubmissions??0} plan submissions remaining</div></div><div className="surface p-5"><div className="text-sm text-zinc-500">Bonus submissions</div><div className="mt-2 text-xl font-semibold">{user.bonusSubmissionBalance}</div></div><div className="surface p-5"><div className="text-sm text-zinc-500">Role</div><div className="mt-2"><StatusPill value={user.role}/></div></div></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Section title="Subscriptions"><div className="table-wrap"><table><thead><tr><th>Plan</th><th>Status</th><th>Source</th><th>Quota</th><th>Period</th></tr></thead><tbody>{user.subscriptions.map(s=><tr key={s.id}><td><div className="font-medium">{s.planNameSnapshot}</div><div className="text-xs text-zinc-400">Paid {s.pricePaidVnd.toLocaleString("vi-VN")} ₫</div></td><td><StatusPill value={s.status}/></td><td>{s.source}</td><td>{s.remainingPlanSubmissions} / {s.submissionLimitSnapshot}</td><td className="text-xs text-zinc-500">{s.startsAt.toLocaleDateString("en-GB")} → {s.expiresAt?.toLocaleDateString("en-GB")||"No expiry"}</td></tr>)}</tbody></table></div></Section>
        <Section title="Writing history">{user.writingSubmissions.length?<div className="divide-y divide-zinc-100">{user.writingSubmissions.map(w=><Link key={w.id} href={`/admin/writing/${w.id}`} className="flex items-center gap-4 py-3 first:pt-0"><div className="min-w-0 flex-1"><div className="text-xs text-zinc-400">{w.taskType==="TASK_1"?"Task 1":"Task 2"} · {w.wordCount} words</div><div className="truncate text-sm font-medium">{w.questionTitle}</div></div><div className="font-semibold">{w.result?<><span className="text-zinc-400">Band </span>{w.result.overallBand.toFixed(1)}</>:"—"}</div></Link>)}</div>:<p className="text-sm text-zinc-500">No submissions.</p>}</Section>
        <Section title="Payment history"><div className="table-wrap"><table><thead><tr><th>Order</th><th>Plan</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead><tbody>{user.paymentOrders.map(p=><tr key={p.id}><td className="font-mono text-xs">{p.transferCode}</td><td>{p.planNameSnapshot}</td><td><StatusPill value={p.status}/></td><td>{p.amountVnd.toLocaleString("vi-VN")} ₫</td><td className="text-xs text-zinc-500">{p.createdAt.toLocaleDateString("en-GB")}</td></tr>)}</tbody></table></div></Section>
        <Section title="Promo redemption history">{user.promoRedemptions.length?<div className="table-wrap"><table><thead><tr><th>Code</th><th>Reward</th><th>Date</th></tr></thead><tbody>{user.promoRedemptions.map(r=><tr key={r.id}><td className="font-mono font-semibold">{r.promoCode.code}</td><td>{r.promoCode.rewardType.replaceAll("_"," ")}</td><td>{r.createdAt.toLocaleString("en-GB")}</td></tr>)}</tbody></table></div>:<p className="text-sm text-zinc-500">No promo redemptions.</p>}</Section>
      </div>
      <aside className="space-y-5">
        <Section title="Adjust submissions" description="Creates bonus Writing submissions and a permanent audit/ledger record."><CreditAdjustmentForm userId={user.id}/></Section>
        <Section title="Credit ledger">{user.creditLedger.length?<div className="space-y-3">{user.creditLedger.map(l=><div key={l.id} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0"><div className="flex justify-between text-sm"><span className="font-medium">{l.bucket} · {l.kind}</span><span className={l.delta>0?"text-emerald-600":"text-red-600"}>{l.delta>0?"+":""}{l.delta}</span></div><div className="mt-1 text-xs text-zinc-500">{l.reason}</div><div className="mt-1 text-xs text-zinc-400">Balance {l.balanceAfter} · {l.createdAt.toLocaleString("en-GB")}</div></div>)}</div>:<p className="text-sm text-zinc-500">No ledger activity.</p>}</Section>
      </aside>
    </div>
  </div>;
}
