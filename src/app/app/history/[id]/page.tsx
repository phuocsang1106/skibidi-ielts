import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ResultTabs } from "@/components/result-tabs";
import { ReportProblem } from "@/components/report-problem";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function stringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, String(entry)]));
}

const criterionOrder: Record<string, number> = {
  taskCriterion: 0,
  coherenceCohesion: 1,
  lexicalResource: 2,
  grammaticalRangeAccuracy: 3
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const sub = await prisma.writingSubmission.findFirst({
    where: { id, userId: user.id },
    include: { result: { include: { criteria: true } } }
  });
  if (!sub?.result) notFound();

  const errors = Array.isArray(sub.result.errors) ? sub.result.errors as Array<Record<string, string>> : [];
  const sentenceImprovements = Array.isArray(sub.result.sentenceImprovements) ? sub.result.sentenceImprovements as Array<Record<string, string>> : [];

  return (
    <>
      <PageHeader title={sub.taskType === "TASK_1" ? "Task 1 Result" : "Task 2 Result"} description={`${sub.questionTitle} · ${sub.createdAt.toLocaleDateString("en-GB")} · ${sub.wordCount} words`} />
      <ResultTabs
        overallBand={sub.result.overallBand.toFixed(1)}
        mainIssue={sub.result.mainIssue}
        criteria={[...sub.result.criteria].sort((left, right) => (criterionOrder[left.key] ?? 99) - (criterionOrder[right.key] ?? 99)).map((criterion) => ({ key: criterion.key, name: criterion.name, band: criterion.band.toFixed(1), summary: criterion.summary, evidence: criterion.evidence, limitingWeaknesses: criterion.limitingWeaknesses }))}
        errors={errors}
        sentenceImprovements={sentenceImprovements}
        priorityImprovements={stringArray(sub.result.priorityImprovements)}
        band7Sample={sub.result.band7Sample}
        improvedEssay={sub.result.improvedEssay}
        detailedCriterionAnalysis={stringRecord(sub.result.detailedCriterionAnalysis)}
        nextBandGuidance={stringArray(sub.result.nextBandGuidance)}
        features={sub.featureSnapshot}
      />
      <div className="mt-6"><ReportProblem submissionId={sub.id} /></div>
    </>
  );
}
