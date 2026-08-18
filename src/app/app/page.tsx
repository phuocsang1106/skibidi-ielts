import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getVocabularyOverview } from "@/lib/vocabulary/service";
import { getEntitlementSummary } from "@/lib/entitlements/service";
import { prisma } from "@/lib/db/prisma";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function ProgressLine({ learned, total }: { learned: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0;
  return <div className="progress-track" style={{ marginTop: 9 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [vocab, entitlement, latest] = await Promise.all([
    getVocabularyOverview(user.id),
    getEntitlementSummary(user.id),
    prisma.writingSubmission.findFirst({ where: { userId: user.id, status: "COMPLETED" }, orderBy: { completedAt: "desc" } }),
  ]);

  const levels = [
    ["Level 1", "3.5 → 5.0", vocab.level1],
    ["Level 2", "5.0 → 6.5", vocab.level2],
    ["Level 3", "6.5+", vocab.level3],
  ] as const;

  return (
    <div>
      <h1 className="page-title">{greeting()}, {user.username}</h1>
      <div className="dashboard-grid">
        <section className="product-card">
          <div className="dashboard-row"><h2 className="section-title">Vocabulary</h2><Link href="/app/vocabulary" className="btn-secondary">Continue</Link></div>
          <div style={{ marginTop: 12 }}>
            {levels.map(([name, range, progress]) => (
              <div className="level-progress" key={name}>
                <div className="dashboard-row">
                  <div><span className="level-name">{name}</span> <span className="level-range">· IELTS {range}</span></div>
                  <span className="muted" style={{ fontSize: 12 }}>{progress.learned} / {progress.total} learned</span>
                </div>
                <ProgressLine learned={progress.learned} total={progress.total} />
              </div>
            ))}
          </div>
        </section>

        <section className="product-card">
          <div className="dashboard-row"><h2 className="section-title">Writing</h2><span className="muted" style={{ fontSize: 11, fontWeight: 700 }}>{entitlement.plan}</span></div>
          <div className="quota-number">{entitlement.quotaRemaining} / {entitlement.quotaLimit}</div>
          <div className="muted" style={{ fontSize: 13 }}>submissions remaining</div>
          <Link href="/app/writing" className="btn-primary" style={{ marginTop: 20 }}>Start Writing</Link>
        </section>
      </div>

      <section className="product-card latest-card">
        <div className="dashboard-row"><h2 className="section-title">Latest submission</h2><Link href="/app/history" className="btn-secondary">History</Link></div>
        {latest ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 680 }}>{latest.taskType === "TASK_1" ? "Task 1" : "Task 2"} · Band <span className="band-red">{latest.estimatedOverallBand?.toFixed(1)}</span></div>
            <div className="muted" style={{ marginTop: 5, fontSize: 12 }}>{latest.completedAt?.toLocaleDateString("en-GB")}</div>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}><div style={{ fontSize: 14, fontWeight: 650 }}>No Writing submissions yet</div></div>
        )}
      </section>
    </div>
  );
}
