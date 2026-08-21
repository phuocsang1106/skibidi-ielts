import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserPlanTable } from "@/components/admin/user-plan-table";

export default async function AdminUsersPage() {
  const [users, plans] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { plan: true, _count: { select: { submissions: true } } }
    }),
    prisma.plan.findMany({ orderBy: { price: "asc" }, select: { id: true, name: true, durationDays: true, isFree: true } })
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Management"
        title="Users"
        description="Xem tài khoản, số bài đã nộp, mở lịch sử Writing, đăng nhập với tư cách user và thay đổi gói. Admin session được giữ riêng khi dùng Login as user."
      />
      <UserPlanTable
        plans={plans}
        users={users.map((user) => ({
          id: user.id,
          username: user.username,
          planId: user.planId,
          planName: user.plan.name,
          planExpireDate: user.planExpireDate?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
          submissionCount: user._count.submissions
        }))}
      />
    </div>
  );
}
