import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserPlanTable } from "@/components/admin/user-plan-table";

export default async function AdminUsersPage() {
  const [users, plans] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { plan: true, aiUsage: true } }),
    prisma.plan.findMany({ orderBy: { price: "asc" }, select: { id: true, name: true, durationDays: true, isFree: true } })
  ]);
  return <div className="space-y-8"><PageHeader eyebrow="Management" title="Users" description="View all accounts and assign a plan. Assigning a paid plan starts a fresh subscription period and resets the AI quota window." /><UserPlanTable plans={plans} users={users.map((user) => ({ id: user.id, username: user.username, planId: user.planId, planName: user.plan.name, planExpireDate: user.planExpireDate?.toISOString() ?? null, createdAt: user.createdAt.toISOString(), usedSubmissions: user.aiUsage.reduce((sum, item) => sum + item.requestCount, 0) }))} /></div>;
}
