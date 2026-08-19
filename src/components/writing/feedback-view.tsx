import { AlertTriangle, ArrowUpRight, CheckCircle2, FileText, Sparkles } from "lucide-react";
import type { PlanFeatures, WritingFeedback } from "@/types/feedback";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function criterionLabel(name: string) {
  const labels: Record<string, string> = {
    "Task Achievement": "Task Achievement · Hoàn thành yêu cầu",
    "Task Response": "Task Response · Đáp ứng đề bài",
    "Coherence and Cohesion": "Coherence & Cohesion · Mạch lạc và liên kết",
    "Lexical Resource": "Lexical Resource · Từ vựng",
    "Grammatical Range and Accuracy": "Grammar · Ngữ pháp và độ chính xác"
  };
  return labels[name] ?? name;
}

export function FeedbackView({ feedback, features }: { feedback: WritingFeedback; features: PlanFeatures }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-slate-950 text-white">
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nhận xét tổng quan</p><p className="mt-3 max-w-3xl leading-7 text-slate-300">{feedback.summary}</p></div>
          {features.bandScore && <div className="w-fit rounded-2xl bg-red-500/10 px-6 py-4 text-center ring-1 ring-red-400/20"><p className="text-xs font-semibold text-red-300">Overall Band Score</p><p className="mt-1 text-4xl font-black text-red-400">{feedback.overallBand.toFixed(1)}</p></div>}
        </div>
      </Card>

      {features.criteria && <section><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h2 className="font-semibold">4 tiêu chí IELTS</h2></div><div className="grid gap-4 xl:grid-cols-2">{feedback.criteria.map((criterion) => <Card key={criterion.name} className="p-6"><div className="flex items-start justify-between gap-4"><h3 className="font-semibold">{criterionLabel(criterion.name)}</h3><Badge className="bg-red-50 text-red-600">Band {criterion.band.toFixed(1)}</Badge></div><p className="mt-4 text-sm leading-6 text-slate-600">{criterion.explanation}</p>{criterion.mistakes.length > 0 && <div className="mt-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />Lỗi cần chú ý</p><ul className="mt-2 space-y-2 text-sm text-slate-600">{criterion.mistakes.map((mistake) => <li key={`${criterion.name}-${mistake}`} className="rounded-xl bg-amber-50/70 p-3">{mistake}</li>)}</ul></div>}<div className="mt-5 rounded-xl bg-emerald-50/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Cách cải thiện</p><p className="mt-2 text-sm leading-6 text-emerald-950">{criterion.correction}</p></div></Card>)}</div></section>}

      {features.errorCorrection && feedback.errorCorrection && feedback.errorCorrection.length > 0 && <section><div className="mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /><h2 className="font-semibold">Sửa lỗi chi tiết</h2></div><Card className="divide-y overflow-hidden">{feedback.errorCorrection.map((item) => <div key={`${item.original}::${item.corrected}`} className="grid gap-3 p-5 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-red-500">Bản gốc</p><p className="mt-2 text-sm leading-6 text-slate-700">{item.original}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Bản sửa</p><p className="mt-2 text-sm leading-6 text-slate-700">{item.corrected}</p><p className="mt-2 text-xs leading-5 text-slate-500">{item.explanation}</p></div></div>)}</Card></section>}
      {features.band7Sample && feedback.band7Sample && <section><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="font-semibold">Bài mẫu Band 7</h2></div><Card className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-700">{feedback.band7Sample}</Card></section>}
      {features.improvedEssay && feedback.improvedEssay && <section><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="font-semibold">Bài viết được cải thiện</h2></div><Card className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-700">{feedback.improvedEssay}</Card></section>}
      {features.nextBandGuidance && feedback.nextBandGuidance && feedback.nextBandGuidance.length > 0 && <section><div className="mb-4 flex items-center gap-2"><ArrowUpRight className="h-5 w-5" /><h2 className="font-semibold">Hướng dẫn tăng band</h2></div><Card className="p-6"><ul className="space-y-3">{feedback.nextBandGuidance.map((tip) => <li key={tip} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />{tip}</li>)}</ul></Card></section>}
    </div>
  );
}
