import Link from "next/link";
import { approvePaymentAction, rejectPaymentAction } from "@/actions/admin";
import { AdminPageHeader, EmptyAdmin, StatusPill } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { expireStalePaymentOrders } from "@/lib/services/payments";

export default async function AdminPaymentsPage({searchParams}:{searchParams:Promise<{status?:string}>}){
  await expireStalePaymentOrders();
  const {status}=await searchParams;
  const allowed=["PENDING","TRANSFER_REPORTED","APPROVED","REJECTED","EXPIRED"];
  const filter=allowed.includes(status||"")?status as "PENDING"|"TRANSFER_REPORTED"|"APPROVED"|"REJECTED"|"EXPIRED":undefined;
  const payments=await prisma.paymentOrder.findMany({where:filter?{status:filter}:undefined,orderBy:{createdAt:"desc"},take:150,include:{user:{select:{username:true}},plan:{select:{displayName:true}}}});
  return <div><AdminPageHeader title="Payments" description="Manual bank transfers never activate themselves. Only an explicit Admin approval grants the snapshotted subscription."/>
    <div className="mb-5 flex flex-wrap gap-2"><Link className={`btn ${!filter?"btn-primary":"btn-secondary"}`} href="/admin/payments">All</Link>{allowed.map(s=><Link key={s} className={`btn ${filter===s?"btn-primary":"btn-secondary"}`} href={`/admin/payments?status=${s}`}>{s.replaceAll("_"," ")}</Link>)}</div>
    {payments.length?<div className="table-wrap"><table><thead><tr><th>User / order</th><th>Plan</th><th>Amount</th><th>Status</th><th>Reported</th><th>Action</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td><Link className="font-medium" href={`/admin/users/${p.userId}`}>{p.user.username}</Link><div className="mt-1 font-mono text-xs text-zinc-400">{p.transferCode}</div></td><td><div className="font-medium">{p.planNameSnapshot}</div><div className="text-xs text-zinc-400">Snapshot: {p.submissionLimitSnapshot} submissions</div></td><td>{p.amountVnd.toLocaleString("vi-VN")} ₫</td><td><StatusPill value={p.status}/>{p.rejectionReason?<div className="mt-1 max-w-xs text-xs text-red-600">{p.rejectionReason}</div>:null}</td><td className="text-xs text-zinc-500">{p.transferReportedAt?.toLocaleString("en-GB")||"—"}</td><td>{p.status==="TRANSFER_REPORTED"?<div className="flex min-w-64 flex-col gap-2"><form action={approvePaymentAction.bind(null,p.id)}><button className="btn btn-primary w-full">Approve & grant</button></form><form action={rejectPaymentAction.bind(null,p.id)} className="flex gap-2"><input className="input" name="reason" required placeholder="Reject reason"/><button className="btn btn-danger">Reject</button></form></div>:<span className="text-xs text-zinc-400">No action</span>}</td></tr>)}</tbody></table></div>:<EmptyAdmin>No payments in this view.</EmptyAdmin>}
  </div>;
}
