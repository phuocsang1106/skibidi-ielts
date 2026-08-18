import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getVocabularyOverview } from "@/lib/vocabulary/service";
import { getEntitlementSummary } from "@/lib/entitlements/service";
import { prisma } from "@/lib/db/prisma";
import { ProgressBar } from "@/components/progress-bar";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [vocab, entitlement, latest] = await Promise.all([
    getVocabularyOverview(user.id),
    getEntitlementSummary(user.id),
    prisma.writingSubmission.findFirst({ where: { userId: user.id, status: "COMPLETED" }, orderBy: { completedAt: "desc" } })
  ]);

  return <div>
    <h1 className="text-2xl font-semibold tracking-tight">{greeting()}, {user.username}</h1>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="surface p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Vocabulary</h2><Link href="/app/vocabulary" className="text-sm font-medium text-blue-700">Continue</Link></div>
        <div className="mt-5 space-y-5">
          <div><div className="flex justify-between gap-4 text-sm"><span><strong>Level 1</strong> · IELTS 3.5 → 5.0</span><span className="text-gray-500">{vocab.level1.learned} / {vocab.level1.total} learned</span></div><div className="mt-2"><ProgressBar value={vocab.level1.learned} max={vocab.level1.total} /></div></div>
          <div><div className="flex justify-between gap-4 text-sm"><span><strong>Level 2</strong> · IELTS 5.0 → 6.5</span><span className="text-gray-500">{vocab.level2.learned} / {vocab.level2.total} learned</span></div><div className="mt-2"><ProgressBar value={vocab.level2.learned} max={vocab.level2.total} /></div></div>
        </div>
      </section>
      <section className="surface p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Writing</h2><span className="text-xs font-medium uppercase tracking-wide text-gray-500">{entitlement.plan}</span></div>
        <p className="mt-5 text-3xl font-semibold">{entitlement.quotaRemaining} / {entitlement.quotaLimit}</p><p className="muted mt-1 text-sm">evaluations remaining</p>
        <Link href="/app/writing" className="btn-primary mt-5">Start Writing</Link>
      </section>
    </div>
    <section className="mt-6 surface p-5"><h2 className="font-semibold">Latest submission</h2>{latest ? <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm"><div><div className="font-medium">{latest.taskType === "TASK_1" ? "Task 1" : "Task 2"} · Estimated Band {latest.estimatedOverallBand?.toFixed(1)}</div><div className="muted mt-1">{latest.completedAt?.toLocaleDateString("en-GB")}</div></div><Link className="btn-secondary" href={`/app/history/${latest.id}`}>View feedback</Link></div> : <div className="mt-4"><p className="font-medium">No Writing submissions yet</p><p className="muted mt-1 text-sm">Start your first IELTS Writing evaluation.</p></div>}</section>
  </div>;
}
