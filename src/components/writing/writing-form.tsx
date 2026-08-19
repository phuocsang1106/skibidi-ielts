"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageUp, Loader2, PenLine, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function WritingForm({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [taskType, setTaskType] = useState<"TASK_1" | "TASK_2">("TASK_2");
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (remaining <= 0) return toast.error("You have no AI requests remaining in this plan period.");
    if (mode === "text" && text.trim().length < 40) return toast.error("Please paste enough text for grading.");
    if (mode === "file" && !file) return toast.error("Choose a file first.");

    setLoading(true);
    try {
      const data = new FormData();
      data.set("taskType", taskType);
      data.set("mode", mode);
      if (mode === "text") data.set("input", text);
      if (mode === "file" && file) data.set("file", file);

      const response = await fetch("/api/writing/grade", { method: "POST", body: data });
      const payload = (await response.json()) as { submissionId?: string; error?: string };
      if (!response.ok || !payload.submissionId) throw new Error(payload.error ?? "Could not grade this submission.");
      toast.success("Your IELTS feedback is ready.");
      router.push(`/dashboard/history/${payload.submissionId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not grade this submission.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="p-5 sm:p-6">
        <p className="text-sm font-semibold">1. Choose task type</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(["TASK_1", "TASK_2"] as const).map((task) => <button key={task} type="button" onClick={() => setTaskType(task)} className={cn("rounded-xl border p-4 text-left transition", taskType === task ? "border-slate-950 bg-slate-950 text-white" : "bg-white hover:bg-slate-50")}><p className="text-xs font-medium opacity-60">IELTS Writing</p><p className="mt-1 font-semibold">{task === "TASK_1" ? "Task 1" : "Task 2"}</p></button>)}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">2. Add your response</p><div className="inline-flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setMode("text")} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition", mode === "text" && "bg-white shadow-sm")}>Paste text</button><button type="button" onClick={() => setMode("file")} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition", mode === "file" && "bg-white shadow-sm")}>Upload file</button></div></div>
        {mode === "text" ? <div className="mt-4"><Textarea aria-label="Writing response" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste your IELTS Writing response here..." className="min-h-72" maxLength={30000} /><div className="mt-2 flex justify-between text-xs text-slate-400"><span>Plain text</span><span>{words} words</span></div></div> : <div className="mt-4"><label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400 hover:bg-white"><input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm"><UploadCloud className="h-5 w-5 text-slate-700" /></span><p className="mt-4 font-semibold">{file ? file.name : "Choose an image or PDF"}</p><p className="mt-2 text-sm text-slate-500">JPG, JPEG, PNG, WEBP or PDF · max 5MB</p>{file && <Badge className="mt-4">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>}</label></div>}
      </Card>

      <Card className="flex flex-col gap-4 bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-sm font-semibold">AI examiner request</p><p className="mt-1 text-xs text-slate-400">{remaining} request(s) remaining before this submission.</p></div><Button type="submit" size="lg" disabled={loading || remaining <= 0} className="bg-white text-slate-950 hover:bg-slate-100">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Grading...</> : <>{mode === "file" ? <ImageUp className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}Grade my writing</>}</Button></Card>
      <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400"><FileText className="h-3.5 w-3.5" />Uploaded binary files are sent to the AI for grading but are not stored in the database.</p>
    </form>
  );
}
