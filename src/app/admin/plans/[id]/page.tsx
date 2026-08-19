import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteOrArchivePlanAction, updatePlanAction } from "@/actions/admin";
import { PlanForm } from "@/components/admin/plan-form";
import { AdminPageHeader, StatusPill } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export default async function AdminPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id }, include: { aiConfig: true, _count: { select: { subscriptions: true, paymentOrders: true, promoCodes: true, writingSubmissions: true } } } });
  if (!plan) notFound();
  const refs=plan._count.subscriptions+plan._count.paymentOrders+plan._count.promoCodes+plan._count.writingSubmissions;
  return <div><AdminPageHeader title={plan.displayName} description={`Plan ID ${plan.id}`} actions={<><StatusPill value={plan.visibility}/><Link href="/admin/plans" className="btn btn-secondary">Back</Link></>}/>
    <div className="mb-5 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Historical references: <strong>{refs}</strong>. {refs>0?"Delete will safely archive this plan; historical foreign keys remain valid.":"This plan has never been referenced and may be hard-deleted."}</div>
    <PlanForm action={updatePlanAction.bind(null,plan.id)} value={plan} submitLabel="Save changes" destructive={<button className="btn btn-danger" formAction={deleteOrArchivePlanAction.bind(null,plan.id)} type="submit">{refs>0?"Archive plan":"Delete plan"}</button>}/>
  </div>;
}
