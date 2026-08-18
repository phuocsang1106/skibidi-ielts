import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { finalWritingResultSchema } from "@/lib/ai/schemas";
import { ResultTabs } from "@/components/result-tabs";
import { createWritingReportAction } from "@/lib/writing/report-actions";

function questionTitle(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Writing submission";
  return cleaned.length > 110 ? `${cleaned.slice(0, 107)}…` : cleaned;
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const submission = await prisma.writingSubmission.findFirst({ where: { id, userId: user.id, status: "COMPLETED" }, include: { reports: { where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!submission) notFound();
  const parsed = finalWritingResultSchema.safeParse(submission.resultJson);
  if (!parsed.success) throw new Error("Stored Writing result failed schema validation.");

  return (
    <div>
      <Link href="/app/history" className="back-link">← Writing History</Link>
      <div className="result-page-head">
        <div>
          <div className="history-task">{submission.taskType === "TASK_1" ? "Task 1" : "Task 2"}</div>
          <h1 className="page-title result-question-title">{questionTitle(submission.questionText)}</h1>
          <div className="history-meta result-meta">{submission.completedAt?.toLocaleDateString("en-GB")} · {submission.wordCount} words</div>
        </div>
        <Link className="btn-secondary" href="/app/writing">Grade another essay</Link>
      </div>

      <ResultTabs result={parsed.data} />

      <details className="result-content-card result-submission-details"><summary>Submitted question and essay</summary><div className="result-detail-sections"><div><h3>Question</h3><p>{submission.questionText}</p></div><div><h3>Essay</h3><p>{submission.essayText}</p></div></div></details>

      <section className="result-content-card result-report">
        <h3>Report a problem</h3>
        {submission.reports[0] ? <p className="muted">Latest report status: {submission.reports[0].status}</p> : null}
        <form action={createWritingReportAction} className="report-form">
          <input type="hidden" name="writingSubmissionId" value={submission.id} />
          <div><label className="label" htmlFor="category">Reason</label><select id="category" name="category" className="input" required><option value="BAND_SCORE_INACCURATE">Band score seems inaccurate</option><option value="FEEDBACK_INCORRECT">Feedback is incorrect</option><option value="QUESTION_MISUNDERSTOOD">AI misunderstood the question</option><option value="IMAGE_UNREADABLE">AI could not read the image</option><option value="OTHER">Other</option></select></div>
          <div><label className="label" htmlFor="message">Tell us what went wrong (optional)</label><textarea id="message" name="message" className="input report-message" maxLength={2000} /></div>
          <div><button className="btn-secondary">Submit report</button></div>
        </form>
      </section>
    </div>
  );
}
