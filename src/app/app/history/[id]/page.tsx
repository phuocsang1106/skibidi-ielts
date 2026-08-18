import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { finalWritingResultSchema } from "@/lib/ai/schemas";
import { ResultTabs } from "@/components/result-tabs";
import { createWritingReportAction } from "@/lib/writing/report-actions";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const submission = await prisma.writingSubmission.findFirst({ where: { id, userId: user.id, status: "COMPLETED" }, include: { reports: { where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!submission) notFound();
  const parsed = finalWritingResultSchema.safeParse(submission.resultJson); if (!parsed.success) throw new Error("Stored Writing result failed schema validation.");
  return <div><Link href="/app/history" className="text-sm text-gray-500">← Writing History</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">{submission.taskType === "TASK_1" ? "Writing Task 1" : "Writing Task 2"}</h1><p className="muted mt-1 text-sm">{submission.completedAt?.toLocaleString("en-GB")} · {submission.wordCount} words · {submission.planAtSubmission} feedback</p></div><Link className="btn-secondary" href="/app/writing">Grade another essay</Link></div><ResultTabs result={parsed.data} />
    <details className="surface mt-3 p-5"><summary className="cursor-pointer font-medium">Submitted question and essay</summary><div className="mt-4 space-y-5 text-sm leading-7"><div><h3 className="font-semibold">Question</h3><p className="mt-2 whitespace-pre-wrap">{submission.questionText}</p></div><div><h3 className="font-semibold">Essay</h3><p className="mt-2 whitespace-pre-wrap">{submission.essayText}</p></div></div></details>
    <section className="surface mt-5 p-5"><h2 className="font-semibold">Report a problem</h2>{submission.reports[0] ? <p className="muted mt-2 text-sm">Latest report status: {submission.reports[0].status}</p> : <p className="muted mt-2 text-sm">Reported essays help improve grading quality.</p>}<form action={createWritingReportAction} className="mt-4 grid gap-3"><input type="hidden" name="writingSubmissionId" value={submission.id} /><label className="label" htmlFor="category">Reason</label><select id="category" name="category" className="input" required><option value="BAND_SCORE_INACCURATE">Band score seems inaccurate</option><option value="FEEDBACK_INCORRECT">Feedback is incorrect</option><option value="QUESTION_MISUNDERSTOOD">AI misunderstood the question</option><option value="IMAGE_UNREADABLE">AI could not read the image</option><option value="OTHER">Other</option></select><label className="label mt-2" htmlFor="message">Tell us what went wrong (optional)</label><textarea id="message" name="message" className="input" maxLength={2000} /><div><button className="btn-secondary">Submit report</button></div></form></section>
  </div>;
}
