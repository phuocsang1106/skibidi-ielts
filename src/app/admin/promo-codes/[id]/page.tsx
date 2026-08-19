import Link from "next/link";
import { notFound } from "next/navigation";
import { archivePromoAction, updatePromoAction } from "@/actions/admin";
import { AdminPromoForm } from "@/components/admin/promo-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export default async function AdminPromoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [promo, plans] = await Promise.all([
    prisma.promoCode.findUnique({
      where: { id },
      include: {
        _count: { select: { redemptions: true } },
        redemptions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { username: true } } }
        }
      }
    }),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, displayName: true, visibility: true } })
  ]);
  if (!promo) notFound();
  return <div>
    <AdminPageHeader title={promo.code} description={`${promo._count.redemptions} redemption${promo._count.redemptions === 1 ? "" : "s"}`} actions={<Link className="btn btn-secondary" href="/admin/promo-codes">Back</Link>}/>
    <AdminPromoForm action={updatePromoAction.bind(null, promo.id)} plans={plans} value={promo} submitLabel="Save changes" destructive={<button className="btn btn-danger" formAction={archivePromoAction.bind(null, promo.id)} type="submit">Archive</button>}/>
    <section className="surface mt-5 p-5"><h2 className="font-semibold">Recent redemptions</h2>{promo.redemptions.length ? <div className="table-wrap mt-4"><table><thead><tr><th>User</th><th>Ordinal</th><th>Date</th></tr></thead><tbody>{promo.redemptions.map(r => <tr key={r.id}><td><Link className="font-medium" href={`/admin/users/${r.userId}`}>{r.user.username}</Link></td><td>{r.ordinal}</td><td>{r.createdAt.toLocaleString("en-GB")}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-zinc-500">No redemptions yet.</p>}</section>
  </div>;
}
