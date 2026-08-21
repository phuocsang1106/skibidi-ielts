import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseStoredFeedback } from "@/lib/feedback";
import { parsePlanFeatures } from "@/lib/plan-features";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { FeedbackView } from "@/components/writing/feedback-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function AdminSubmissionPage({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const { id, submissionId } = await params;
  const submission = await prisma.writingSubmission.findFirst({
    where: { id: submissionId, userId: id },
    include: { user: { select: { id: true, username: true } } }
  });
  if (!submission) notFound();

  const feedback = parseStoredFeedback(submission.feedback);
  const features = parsePlanFeatures(submission.featuresSnapshot);
  const promptAttachment = submission.promptAttachmentName ?? submission.attachmentName;

  if (!feedback) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm"><Link href={`/admin/users/${submission.user.id}`}><ArrowLeft className="h-4 w-4" />Quay lại lịch sử @{submission.user.username}</Link></Button>
        <Card className="p-8"><p className="font-semibold">Không thể đọc kết quả đã lưu.</p></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`@${submission.user.username} · ${formatDate(submission.createdAt)}`}
        title={submission.taskType === "TASK_1" ? "IELTS Writing Task 1" : "IELTS Writing Task 2"}
        description={`Model: ${submission.modelUsed}`}
        action={<div className="flex flex-wrap gap-2"><Badge className="bg-red-50 text-red-600">Band {submission.bandScore.toString()}</Badge><Button asChild variant="outline" size="sm"><Link href={`/admin/users/${submission.user.id}`}><ArrowLeft className="h-4 w-4" />Lịch sử user</Link></Button></div>}
      />
      <FeedbackView feedback={feedback} features={features} />
      {(submission.taskPrompt || promptAttachment) ? (
        <section>
          <h2 className="mb-4 font-semibold">Đề bài</h2>
          <Card className="p-6 text-sm leading-7 text-slate-700">
            {submission.taskPrompt ? <p className="whitespace-pre-wrap">{submission.taskPrompt}</p> : null}
            {promptAttachment ? <p className={submission.taskPrompt ? "mt-4 font-medium" : "font-medium"}>File đề bài: {promptAttachment}</p> : null}
          </Card>
        </section>
      ) : null}
      <section>
        <h2 className="mb-4 font-semibold">Bài làm</h2>
        <Card className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-700">{submission.input}</Card>
      </section>
    </div>
  );
}
