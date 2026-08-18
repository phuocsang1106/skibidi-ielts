"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MAX = 5 * 1024 * 1024;
type ApiError = { code: string; message: string; quotaDeducted: boolean; resetAt?: string };

export function WritingForm({ remaining, limit, resetAt }: { remaining: number; limit: number; resetAt: string }) {
  const router = useRouter();
  const [taskType, setTaskType] = useState<"TASK_1" | "TASK_2">("TASK_2");
  const [essay, setEssay] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const wordCount = useMemo(() => essay.trim() ? essay.trim().split(/\s+/).length : 0, [essay]);

  function validateFile(file: File | undefined) {
    if (file && file.size > MAX) return "File is too large. Maximum file size is 5 MB.";
    return null;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    fd.set("taskType", taskType);
    const q = fd.get("questionFile"); const w = fd.get("writingFile");
    const localError = validateFile(q instanceof File ? q : undefined) || validateFile(w instanceof File ? w : undefined);
    if (localError) { setError({ code: "FILE_TOO_LARGE", message: localError, quotaDeducted: false }); return; }
    setPending(true);
    try {
      const response = await fetch("/api/writing/grade", { method: "POST", body: fd });
      const data = await response.json() as { ok: boolean; submissionId?: string; error?: ApiError };
      if (!response.ok || !data.ok || !data.submissionId) {
        setError(data.error || { code: "GRADING_FAILED", message: "Your essay wasn't graded.", quotaDeducted: false });
        return;
      }
      router.push(`/app/history/${data.submissionId}`);
    } catch {
      setError({ code: "NETWORK_ERROR", message: "The grading request could not be completed. Check your connection and try again.", quotaDeducted: false });
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} className="mt-7 space-y-6">
    <section className="surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Task type</h2><p className="muted mt-1 text-sm">IELTS Academic Writing</p></div><div className="flex gap-2"><button type="button" onClick={() => setTaskType("TASK_1")} className={taskType === "TASK_1" ? "btn-primary" : "btn-secondary"}>Task 1</button><button type="button" onClick={() => setTaskType("TASK_2")} className={taskType === "TASK_2" ? "btn-primary" : "btn-secondary"}>Task 2</button></div></div></section>

    <section className="surface p-5"><h2 className="font-semibold">Question</h2><p className="muted mt-1 text-sm">Upload the IELTS question/prompt. Task 1 requires an image or PDF.</p>{taskType === "TASK_2" && <div className="mt-4"><label htmlFor="questionText" className="label">Question text</label><textarea id="questionText" name="questionText" className="input" placeholder="Paste the Task 2 question here…" /></div>}<div className="mt-4"><label htmlFor="questionFile" className="label">Question file</label><input id="questionFile" name="questionFile" type="file" className="block w-full rounded-md border border-gray-200 bg-white p-3 text-sm" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" /><p className="muted mt-2 text-xs">JPG, JPEG, PNG, WebP or PDF · maximum 5 MB.</p></div></section>

    <section className="surface p-5"><h2 className="font-semibold">Your Writing</h2><div className="mt-4"><label htmlFor="essayText" className="label">Essay editor</label><textarea id="essayText" name="essayText" value={essay} onChange={(e) => setEssay(e.target.value)} className="input min-h-72" placeholder="Type or paste your essay here…" /><div className="muted mt-2 text-right text-xs">{wordCount} words</div></div><div className="my-5 flex items-center gap-3 text-xs text-gray-400"><span className="h-px flex-1 bg-gray-200" /><span>OR</span><span className="h-px flex-1 bg-gray-200" /></div><div><label htmlFor="writingFile" className="label">Writing file</label><input id="writingFile" name="writingFile" type="file" className="block w-full rounded-md border border-gray-200 bg-white p-3 text-sm" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx,image/jpeg,image/png,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /><p className="muted mt-2 text-xs">JPG, JPEG, PNG, WebP, PDF, TXT or DOCX · maximum 5 MB. Use either this file or the editor above.</p></div></section>

    {error && <div className="error-box" role="alert"><div className="font-semibold">{error.code === "QUESTION_IMAGE_UNREADABLE" ? "We couldn't read this question" : error.code === "QUOTA_EXHAUSTED" ? "Writing quota used" : "Your essay wasn't graded"}</div><p className="mt-1 text-sm">{error.message}</p>{!error.quotaDeducted && <p className="mt-2 text-sm font-medium">No Writing evaluation was deducted.</p>}{error.resetAt && <p className="mt-1 text-sm">Next cycle: {new Date(error.resetAt).toLocaleString()}</p>}</div>}

    <div className="flex flex-wrap items-center justify-between gap-4"><p className="muted text-sm">{remaining} / {limit} evaluations remaining · resets {new Date(resetAt).toLocaleString()}</p><button className="btn-primary min-w-40" disabled={pending || remaining <= 0}>{pending ? "Evaluating Writing…" : "Submit for grading"}</button></div>
  </form>;
}
