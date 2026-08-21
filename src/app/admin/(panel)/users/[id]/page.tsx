import Link from "next/link";
import { ArrowLeft, Clock3, Eye, FileText, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminUserHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      plan: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        select: { id: true, taskType: true, bandScore: true, modelUsed: true, createdAt: true }
      }
    }
  });
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="User activity"
        title={`@${user.username}`}
        description="Lịch sử các bài Writing đã nộp và kết quả chấm của tài khoản này."
        action={<UserAdminActions userId={user.id} username={user.username} showHistory={false} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><UserRound className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan</p><p className="mt-1 font-semibold">{user.plan.name}</p></div></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><FileText className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Submissions</p><p className="mt-1 font-semibold">{user.submissions.length} bài</p></div></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><Clock3 className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Joined / Expiry</p><p className="mt-1 text-sm font-semibold">{formatDate(user.createdAt)} · {formatDate(user.planExpireDate)}</p></div></div>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Writing submission history</h2>
        <Button asChild variant="ghost" size="sm"><Link href="/admin/users"><ArrowLeft className="h-4 w-4" />All users</Link></Button>
      </div>

      {user.submissions.length ? (
        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Band</th>
                  <th className="px-5 py-4">Model</th>
                  <th className="px-5 py-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {user.submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-500">{formatDate(submission.createdAt)}</td>
                    <td className="px-5 py-4 font-medium">{submission.taskType === "TASK_1" ? "IELTS Writing Task 1" : "IELTS Writing Task 2"}</td>
                    <td className="px-5 py-4"><Badge className="bg-red-50 text-red-600">Band {submission.bandScore.toString()}</Badge></td>
                    <td className="px-5 py-4 text-xs text-slate-500">{submission.modelUsed}</td>
                    <td className="px-5 py-4 text-right"><Button asChild variant="ghost" size="sm"><Link href={`/admin/users/${user.id}/submissions/${submission.id}`}><Eye className="h-4 w-4" />Xem bài</Link></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Clock3} title="Chưa có bài nộp" description="User này chưa gửi bài Writing nào để chấm." />
      )}
    </div>
  );
}
