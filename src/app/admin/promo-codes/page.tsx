import Link from "next/link";
import { createPromoAction } from "@/actions/admin";
import { AdminPageHeader, StatusPill } from "@/components/admin/ui";
import { AdminPromoForm } from "@/components/admin/promo-form";
import { prisma } from "@/lib/db";

export default async function AdminPromoCodesPage() {
  const [promos,plans]=await Promise.all([
    prisma.promoCode.findMany({ orderBy:{createdAt:"desc"}, include:{grantPlan:{select:{displayName:true}},_count:{select:{redemptions:true}}} }),
    prisma.plan.findMany({where:{visibility:{not:"ARCHIVED"}},orderBy:{sortOrder:"asc"},select:{id:true,displayName:true,visibility:true}})
  ]);
  return <div><AdminPageHeader title="Promo Codes" description="Promo rewards are deliberately restricted to Grant Plan and Add Submissions."/>
    <div className="table-wrap mb-7"><table><thead><tr><th>Code</th><th>Reward</th><th>Usage</th><th>State</th><th>Expires</th><th/></tr></thead><tbody>{promos.map(p=><tr key={p.id}><td><div className="font-mono font-semibold">{p.code}</div></td><td>{p.rewardType==="GRANT_PLAN"?`Grant ${p.grantPlan?.displayName||"plan"}`:`+${p.addSubmissions||0} submissions`}</td><td>{p._count.redemptions}{p.maxTotalRedemptions?` / ${p.maxTotalRedemptions}`:""}</td><td>{p.archivedAt?<StatusPill value="ARCHIVED"/>:p.isActive?<StatusPill value="ACTIVE"/>:<StatusPill value="DISABLED"/>}</td><td className="text-xs text-zinc-500">{p.expiresAt?.toLocaleString("en-GB")||"Never"}</td><td><Link href={`/admin/promo-codes/${p.id}`} className="text-sm font-semibold">Edit →</Link></td></tr>)}</tbody></table></div>
    <div className="mb-4"><h2 className="text-lg font-semibold">Create promo code</h2></div><AdminPromoForm action={createPromoAction} plans={plans}/>
  </div>;
}
