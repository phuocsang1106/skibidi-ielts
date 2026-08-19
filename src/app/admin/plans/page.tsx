import Link from "next/link";
import { createPlanAction } from "@/actions/admin";
import { AdminPageHeader, StatusPill } from "@/components/admin/ui";
import { PlanForm } from "@/components/admin/plan-form";
import { prisma } from "@/lib/db";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceVnd: "asc" }], include: { aiConfig: true, _count: { select: { subscriptions: true, paymentOrders: true } } } });
  return <div><AdminPageHeader title="Plans" description="Pricing, entitlements and AI behavior are database records. No plan name is compiled into application authorization logic."/>
    <div className="table-wrap mb-7"><table><thead><tr><th>Plan</th><th>Visibility</th><th>Price</th><th>Quota</th><th>AI requests</th><th>References</th><th/></tr></thead><tbody>{plans.map(p=><tr key={p.id}><td><div className="font-medium">{p.displayName}</div><div className="text-xs text-zinc-400">{p.slug}{p.badge?` · ${p.badge}`:""}</div></td><td><StatusPill value={p.visibility}/></td><td>{p.priceVnd.toLocaleString("vi-VN")} ₫</td><td>{p.submissionLimit}</td><td>{p.aiRequestsPerSubmission}</td><td className="text-xs text-zinc-500">{p._count.subscriptions} subscriptions · {p._count.paymentOrders} payments</td><td><Link className="text-sm font-semibold" href={`/admin/plans/${p.id}`}>Edit →</Link></td></tr>)}</tbody></table></div>
    <div className="mb-4"><h2 className="text-lg font-semibold">Create plan</h2><p className="mt-1 text-sm text-zinc-500">New plan records automatically participate in pricing, entitlement checks and pipeline resolution.</p></div>
    <PlanForm action={createPlanAction}/>
  </div>;
}
