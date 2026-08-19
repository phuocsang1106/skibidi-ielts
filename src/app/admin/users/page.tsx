import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminPageHeader, EmptyAdmin, StatusPill } from "@/components/admin/ui";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const users = await prisma.user.findMany({
    where: query ? { username: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" }, take: 100,
    include: { subscriptions: { where: { status: { in: ["ACTIVE","QUEUED"] } }, orderBy: { startsAt: "desc" }, take: 2 } }
  });
  return <div><AdminPageHeader title="Users" description="Search accounts, inspect entitlement history and make audited submission adjustments."/>
    <form className="mb-5 flex max-w-xl gap-2"><input className="input" name="q" defaultValue={query} placeholder="Search username"/><button className="btn btn-secondary">Search</button></form>
    {users.length ? <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Current plan</th><th>Bonus</th><th>Created</th><th/></tr></thead><tbody>{users.map(u=>{const active=u.subscriptions.find(s=>s.status==="ACTIVE");return <tr key={u.id}><td><div className="font-medium">{u.username}</div><div className="text-xs text-zinc-400">{u.id}</div></td><td><StatusPill value={u.role}/></td><td>{active?<><div className="font-medium">{active.planNameSnapshot}</div><div className="text-xs text-zinc-400">{active.remainingPlanSubmissions} plan submissions</div></>:<span className="text-zinc-400">None</span>}</td><td>{u.bonusSubmissionBalance}</td><td className="text-sm text-zinc-500">{u.createdAt.toLocaleDateString("en-GB")}</td><td><Link className="text-sm font-semibold" href={`/admin/users/${u.id}`}>Open →</Link></td></tr>})}</tbody></table></div> : <EmptyAdmin>No users match this search.</EmptyAdmin>}
  </div>;
}
