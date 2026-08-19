"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, PenLine, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function WritingForm({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [taskType, setTaskType] = useState<"TASK_1" | "TASK_2">("TASK_2");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const [promptFile, setPromptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const words = useMemo(() => essay.trim() ? essay.trim().split(/\s+/).length : 0, [essay]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (remaining <= 0) return toast.error("Bạn đã hết lượt chấm Writing.");
    if (!taskPrompt.trim() && !promptFile) return toast.error("Hãy nhập đề bài hoặc tải ảnh/PDF của đề.");
    if (essay.trim().length < 40) return toast.error("Bài làm cần dài hơn để AI có thể chấm.");

    setLoading(true);
    try {
      const data = new FormData();
      data.set("taskType", taskType);
      data.set("taskPrompt", taskPrompt);
      data.set("essay", essay);
      if (promptFile) data.set("promptFile", promptFile);

      const response = await fetch("/api/writing/grade", { method: "POST", body: data });
      const payload = (await response.json()) as { submissionId?: string; error?: string };
      if (!response.ok || !payload.submissionId) throw new Error(payload.error ?? "Không thể chấm bài lúc này.");
      toast.success("Đã chấm xong bài Writing.");
      router.push(`/dashboard/history/${payload.submissionId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể chấm bài lúc này.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex justify-end">
        <div className="inline-flex rounded-xl border bg-white p-1 shadow-sm" aria-label="Chọn loại IELTS Writing">
          {(["TASK_1", "TASK_2"] as const).map((task) => (
            <button
              key={task}
              type="button"
              onClick={() => setTaskType(task)}
              className={cn("rounded-lg px-3.5 py-2 text-xs font-bold transition", taskType === task ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-950")}
            >
              {task === "TASK_1" ? "Task 1" : "Task 2"}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Đề bài</p><h2 className="mt-1 font-semibold">IELTS Writing {taskType === "TASK_1" ? "Task 1" : "Task 2"}</h2></div>
          <label className="cursor-pointer">
            <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setPromptFile(event.target.files?.[0] ?? null)} />
            <span className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-slate-50"><FileUp className="h-4 w-4" />Ảnh / PDF</span>
          </label>
        </div>
        <Textarea
          aria-label="Đề bài IELTS Writing"
          value={taskPrompt}
          onChange={(event) => setTaskPrompt(event.target.value)}
          placeholder={taskType === "TASK_1" ? "Dán đề Task 1 hoặc tải biểu đồ/ảnh/PDF ở góc phải..." : "Dán đầy đủ đề Task 2 ở đây..."}
          className="mt-4 min-h-36"
          maxLength={12000}
        />
        {promptFile && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{promptFile.name}</p><p className="text-xs text-slate-400">{(promptFile.size / 1024 / 1024).toFixed(2)} MB</p></div>
            <button type="button" onClick={() => setPromptFile(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-white" aria-label="Xóa file"><X className="h-4 w-4" /></button>
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Bài làm</p><h2 className="mt-1 font-semibold">Your response</h2></div><Badge>{words} words</Badge></div>
        <Textarea aria-label="Bài làm IELTS Writing" value={essay} onChange={(event) => setEssay(event.target.value)} placeholder="Dán bài Writing của bạn ở đây..." className="mt-4 min-h-[380px]" maxLength={30000} />
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading || remaining <= 0} className="min-w-44">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Đang chấm...</> : <><PenLine className="h-4 w-4" />Chấm bài</>}
        </Button>
      </div>
    </form>
  );
}
