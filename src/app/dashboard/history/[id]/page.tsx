import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseStoredFeedback } from "@/lib/feedback";
import { parsePlanFeatures } from "@/lib/plan-features";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { FeedbackView } from "@/components/writing/feedback-view";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const submission = await prisma.writingSubmission.findFirst({ where: { id, userId: user.id } });
  if (!submission) notFound();
  const feedback = parseStoredFeedback(submission.feedback);
  const features = parsePlanFeatures(submission.featuresSnapshot);
  if (!feedback) return <Card className="p-8"><p className="font-semibold">Stored feedback is invalid.</p><p className="mt-2 text-sm text-slate-500">Please contact an administrator and reference submission {submission.id}.</p></Card>;
  return <div className="space-y-8"><PageHeader eyebrow="Writing result" title={submission.taskType === "TASK_1" ? "IELTS Writing Task 1" : "IELTS Writing Task 2"} description={`Graded ${formatDate(submission.createdAt)} · Model: ${submission.modelUsed}`} action={features.bandScore ? <Badge className="bg-red-50 text-red-600">Band {submission.bandScore.toString()}</Badge> : undefined} /><FeedbackView feedback={feedback} features={features} /><section><h2 className="mb-4 font-semibold">Original input</h2><Card className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-600">{submission.input}</Card></section></div>;
}
