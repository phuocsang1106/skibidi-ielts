import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function questionTitle(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Writing submission";
  return cleaned.length > 92 ? `${cleaned.slice(0, 89)}…` : cleaned;
}

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await prisma.writingSubmission.findMany({ where: { userId: user.id, status: "COMPLETED" }, orderBy: { completedAt: "desc" } });

  return (
    <div>
      <h1 className="page-title">Writing History</h1>
      <div className="history-list">
        {items.length ? items.map((item) => (
          <Link href={`/app/history/${item.id}`} key={item.id} className="history-item">
            <span className="history-main">
              <span className="history-task">{item.taskType === "TASK_1" ? "Task 1" : "Task 2"}</span>
              <span className="history-title">{questionTitle(item.questionText)}</span>
              <span className="history-meta">{item.completedAt?.toLocaleDateString("en-GB")} · {item.wordCount} words</span>
            </span>
            <span className="history-band"><span className="history-band-label">Band</span><span className="history-band-number">{item.estimatedOverallBand?.toFixed(1)}</span></span>
          </Link>
        )) : (
          <div className="product-card" style={{ marginTop: 26 }}>
            <div style={{ fontSize: 14, fontWeight: 680 }}>No Writing submissions yet</div>
            <Link href="/app/writing" className="btn-primary" style={{ marginTop: 16 }}>Start Writing</Link>
          </div>
        )}
      </div>
    </div>
  );
}
