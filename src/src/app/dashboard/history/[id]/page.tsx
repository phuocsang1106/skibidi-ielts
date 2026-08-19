import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseStoredFeedback } from "@/lib/feedback";
import { parsePlanFeatures } from "@/lib/plan-features";
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
  if (!feedback) return <Card className="p-8"><p className="font-semibold">Không thể đọc kết quả đã lưu.</p></Card>;
  const promptAttachment = submission.promptAttachmentName ?? submission.attachmentName;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Writing result" title={submission.taskType === "TASK_1" ? "IELTS Writing Task 1" : "IELTS Writing Task 2"} action={features.bandScore ? <Badge className="bg-red-50 text-red-600">Band {submission.bandScore.toString()}</Badge> : undefined} />
      <FeedbackView feedback={feedback} features={features} />
      {(submission.taskPrompt || promptAttachment) && <section><h2 className="mb-4 font-semibold">Đề bài</h2><Card className="p-6 text-sm leading-7 text-slate-700">{submission.taskPrompt ? <p className="whitespace-pre-wrap">{submission.taskPrompt}</p> : null}{promptAttachment ? <p className={submission.taskPrompt ? "mt-4 font-medium" : "font-medium"}>File đề bài: {promptAttachment}</p> : null}</Card></section>}
      <section><h2 className="mb-4 font-semibold">Bài làm</h2><Card className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-700">{submission.input}</Card></section>
    </div>
  );
}
