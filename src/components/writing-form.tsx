"use client";

import { useMemo, useState } from "react";
import { FileImage, FileText, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

function countWords(text: string) { const value = text.trim(); return value ? value.split(/\s+/).length : 0; }

export function WritingForm({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [taskType, setTaskType] = useState<"TASK_1"|"TASK_2">("TASK_2");
  const [essay, setEssay] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const words = useMemo(() => countWords(essay), [essay]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    form.set("taskType", taskType); form.set("idempotencyKey", key);
    try {
      const response = await fetch("/api/writing/submit", { method: "POST", body: form });
      const data = await response.json() as { ok?: boolean; submissionId?: string; message?: string };
      if (!response.ok || !data.submissionId) { setError(data.message || "Writing submission failed. No Writing submission was deducted."); return; }
      router.push(`/app/history/${data.submissionId}`); router.refresh();
    } catch { setError("AI grading is temporarily unavailable. No Writing submission was deducted."); }
    finally { setSubmitting(false); }
  }

  return <form onSubmit={submit} className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1"><button type="button" onClick={()=>setTaskType("TASK_1")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${taskType==="TASK_1"?"bg-zinc-900 text-white":"text-zinc-600"}`}>Task 1</button><button type="button" onClick={()=>setTaskType("TASK_2")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${taskType==="TASK_2"?"bg-zinc-900 text-white":"text-zinc-600"}`}>Task 2</button></div><span className="text-sm text-zinc-500"><strong className="text-zinc-900">{remaining}</strong> submissions remaining</span></div>
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="surface p-5"><div className="mb-4 flex items-center gap-2"><FileImage size={18}/><h2 className="font-semibold">Question</h2></div>
        {taskType==="TASK_2" ? <><label className="label" htmlFor="questionText">Task 2 question</label><textarea id="questionText" name="questionText" rows={11} className="input resize-y" placeholder="Paste the exact Task 2 question here." required/><div className="mt-4"><label className="label" htmlFor="questionFile">Optional question file</label><input id="questionFile" name="questionFile" type="file" accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border file:border-zinc-200 file:bg-white file:px-3 file:py-2"/><p className="mt-1 text-xs text-zinc-500">TXT or DOCX, up to 5 MB.</p></div></> : <><label className="label" htmlFor="questionFileTask1">Task 1 image or PDF</label><div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5"><Upload size={20} className="mb-2 text-zinc-500"/><input id="questionFileTask1" name="questionFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="block w-full text-sm"/><p className="mt-2 text-xs text-zinc-500">JPG, PNG, WebP or PDF, up to 5 MB. The grading model inspects the actual visual.</p></div><div className="mt-4"><label className="label" htmlFor="task1QuestionText">Optional question text</label><textarea id="task1QuestionText" name="questionText" rows={4} className="input" placeholder="Add the written instruction if useful."/></div></>}
      </section>
      <section className="surface p-5"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FileText size={18}/><h2 className="font-semibold">Your Writing</h2></div><span className="text-xs font-medium text-zinc-500">{words} words</span></div><label className="sr-only" htmlFor="essayText">Your Writing response</label><textarea id="essayText" name="essayText" rows={17} value={essay} onChange={(e)=>setEssay(e.target.value)} className="input min-h-[370px] resize-y" placeholder="Write or paste your response here."/><div className="mt-4"><label className="label" htmlFor="essayFile">Or upload a response file</label><input id="essayFile" name="essayFile" type="file" accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border file:border-zinc-200 file:bg-white file:px-3 file:py-2"/><p className="mt-1 text-xs text-zinc-500">TXT or DOCX, up to 5 MB. Typed text takes priority when both are provided.</p></div></section>
    </div>
    <div className="flex justify-end"><button className="btn btn-primary min-w-40" disabled={submitting||remaining<1}>{submitting?<><LoaderCircle size={16} className="animate-spin"/>Grading…</>:"Submit for grading"}</button></div>
  </form>;
}
