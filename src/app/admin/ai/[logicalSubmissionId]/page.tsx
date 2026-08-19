import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Section, StatusPill } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export default async function AdminAiPipelinePage({ params }: { params: Promise<{ logicalSubmissionId: string }> }) {
  const { logicalSubmissionId } = await params;
  const [logs, submission] = await Promise.all([
    prisma.aiCallLog.findMany({
      where: { logicalSubmissionId },
      orderBy: { startedAt: "asc" },
      include: { user: { select: { username: true } }, plan: { select: { displayName: true } } }
    }),
    prisma.writingSubmission.findUnique({
      where: { id: logicalSubmissionId },
      select: { id: true, taskType: true, questionTitle: true, createdAt: true }
    })
  ]);
  if (!logs.length) notFound();

  const first = logs[0];
  if (!first) notFound();
  const totalLatency = logs.reduce((sum, log) => sum + log.latencyMs, 0);
  const totalTokens = logs.reduce((sum, log) => sum + (log.totalTokens ?? 0), 0);
  const totalCost = logs.reduce((sum, log) => sum + Number(log.costUsd ?? 0), 0);
  const failed = logs.filter((log) => log.status === "FAILURE").length;

  return (
    <div>
      <AdminPageHeader
        title="AI pipeline"
        description={logicalSubmissionId}
        actions={submission ? <Link href={`/admin/writing/${submission.id}`} className="btn btn-secondary">Open Writing submission</Link> : <Link href="/admin/ai" className="btn btn-secondary">Back to AI / Models</Link>}
      />

      {!submission ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This grading attempt did not persist a Writing submission. That is expected when a required AI stage fails before the success transaction; no Writing credit is consumed by this failed pipeline.
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="surface p-4"><div className="text-xs text-zinc-500">User</div><div className="mt-1 font-semibold">{first.user.username}</div></div>
        <div className="surface p-4"><div className="text-xs text-zinc-500">Plan</div><div className="mt-1 font-semibold">{first.plan.displayName}</div></div>
        <div className="surface p-4"><div className="text-xs text-zinc-500">Pipeline size</div><div className="mt-1 font-semibold">{first.pipelineSize}</div></div>
        <div className="surface p-4"><div className="text-xs text-zinc-500">Calls logged</div><div className="mt-1 font-semibold">{logs.length} · {failed} failed</div></div>
        <div className="surface p-4"><div className="text-xs text-zinc-500">Total latency</div><div className="mt-1 font-semibold">{totalLatency.toLocaleString()} ms</div></div>
      </div>

      {submission ? (
        <Section title="Persisted submission">
          <div className="text-sm text-zinc-600">{submission.taskType === "TASK_1" ? "Task 1" : "Task 2"} · {submission.questionTitle}</div>
          <div className="mt-1 text-xs text-zinc-400">{submission.createdAt.toLocaleString("en-GB")}</div>
        </Section>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <Section title="AI calls" description="Safe diagnostics only; full essay/file payloads are not retained here.">
          <div className="space-y-4">
            {logs.map((log, index) => (
              <article key={log.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="text-xs text-zinc-400">Request {index + 1}</div><div className="font-semibold">{log.stage}</div></div>
                  <StatusPill value={log.status} />
                </div>
                <div className="mt-2 break-all font-mono text-xs text-zinc-500">{log.model}</div>
                <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1 text-xs text-zinc-500 sm:grid-cols-4">
                  <div><dt>Started</dt><dd className="mt-0.5 text-zinc-800">{log.startedAt.toLocaleString("en-GB")}</dd></div>
                  <div><dt>Latency</dt><dd className="mt-0.5 text-zinc-800">{log.latencyMs} ms</dd></div>
                  <div><dt>HTTP</dt><dd className="mt-0.5 text-zinc-800">{log.providerStatus ?? "—"}</dd></div>
                  <div><dt>Tokens</dt><dd className="mt-0.5 text-zinc-800">{log.totalTokens ?? "—"}</dd></div>
                </dl>
                {log.status === "FAILURE" ? (
                  <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    <div className="font-semibold">{log.errorCategory || "UNKNOWN"}{log.errorCode ? ` · ${log.errorCode}` : ""}</div>
                    {log.sanitizedError ? <div className="mt-1 break-words">{log.sanitizedError}</div> : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </Section>
        <aside>
          <Section title="Totals">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Tokens</dt><dd className="font-medium">{totalTokens || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Provider cost</dt><dd className="font-medium">{totalCost ? `$${totalCost.toFixed(6)}` : "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Rubric</dt><dd className="max-w-44 break-all text-right font-mono text-xs">{first.rubricVersion}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Prompt</dt><dd className="max-w-44 break-all text-right font-mono text-xs">{first.promptVersion}</dd></div>
            </dl>
          </Section>
        </aside>
      </div>
    </div>
  );
}
