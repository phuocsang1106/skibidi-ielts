"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MAX = 5 * 1024 * 1024;
type ApiError = { code: string; message: string; quotaDeducted: boolean; resetAt?: string };

function UploadBox({
  id,
  name,
  accept,
  title,
  helper,
}: {
  id: string;
  name: string;
  accept: string;
  title: string;
  helper: string;
}) {
  const [fileName, setFileName] = useState("");
  return (
    <label className="upload-box" htmlFor={id}>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
      />
      <span className="upload-title">{fileName || title}</span>
      <span className="upload-helper">{fileName ? "Click to choose a different file" : helper}</span>
    </label>
  );
}

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
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    fd.set("taskType", taskType);
    const q = fd.get("questionFile");
    const w = fd.get("writingFile");
    const localError = validateFile(q instanceof File ? q : undefined) || validateFile(w instanceof File ? w : undefined);
    if (localError) {
      setError({ code: "FILE_TOO_LARGE", message: localError, quotaDeducted: false });
      return;
    }
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
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="writing-v7-form">
      <div className="writing-v7-header">
        <h1 className="page-title">IELTS Writing</h1>
        <div className="task-switch" role="group" aria-label="Writing task type">
          <button type="button" className={taskType === "TASK_1" ? "active" : ""} onClick={() => setTaskType("TASK_1")}>Task 1</button>
          <button type="button" className={taskType === "TASK_2" ? "active" : ""} onClick={() => setTaskType("TASK_2")}>Task 2</button>
        </div>
      </div>

      <div className="writing-v7-grid">
        <section className="writing-v7-card">
          <h2 className="section-title">Question</h2>
          {taskType === "TASK_2" && (
            <div className="writing-field">
              <label htmlFor="questionText" className="label">Question text</label>
              <textarea id="questionText" name="questionText" className="input writing-question-text" placeholder="Paste the Task 2 question here…" />
            </div>
          )}
          <div className="writing-field">
            <span className="label">Question file</span>
            <UploadBox
              id="questionFile"
              name="questionFile"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              title="Upload question file"
              helper="JPG, JPEG, PNG, WebP or PDF · max 5 MB"
            />
          </div>
        </section>

        <section className="writing-v7-card">
          <h2 className="section-title">Your Writing</h2>
          <div className="writing-field">
            <label htmlFor="essayText" className="label">Essay editor</label>
            <textarea
              id="essayText"
              name="essayText"
              value={essay}
              onChange={(event) => setEssay(event.target.value)}
              className="input writing-essay-text"
              placeholder="Type or paste your essay here…"
            />
            <div className="writing-word-count">{wordCount} words</div>
          </div>
          <div className="writing-field">
            <span className="label">Writing file</span>
            <UploadBox
              id="writingFile"
              name="writingFile"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx,image/jpeg,image/png,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              title="Upload Writing file"
              helper="JPG, JPEG, PNG, WebP, PDF, TXT or DOCX · max 5 MB"
            />
          </div>
        </section>
      </div>

      {error && (
        <div className="error-box writing-v7-error" role="alert">
          <div style={{ fontWeight: 700 }}>
            {error.code === "QUESTION_IMAGE_UNREADABLE" ? "We couldn't read this question" : error.code === "QUOTA_EXHAUSTED" ? "Writing quota used" : "Your essay wasn't graded"}
          </div>
          <p>{error.message}</p>
          {!error.quotaDeducted && <p className="writing-v7-error-strong">No Writing submission was deducted.</p>}
          {error.resetAt && <p>Next cycle: {new Date(error.resetAt).toLocaleString()}</p>}
        </div>
      )}

      <div className="writing-submitbar">
        <span className="muted writing-quota-copy">{remaining} / {limit} submissions remaining · resets {new Date(resetAt).toLocaleDateString("en-GB")}</span>
        <button className="btn-primary writing-submit" disabled={pending || remaining <= 0}>{pending ? "Evaluating Writing…" : "Submit for grading"}</button>
      </div>
    </form>
  );
}
