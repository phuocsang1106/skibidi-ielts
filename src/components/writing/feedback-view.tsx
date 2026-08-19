import { AlertTriangle, ArrowUpRight, CheckCircle2, FileText, Sparkles } from "lucide-react";
import type { PlanFeatures, WritingFeedback } from "@/types/feedback";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FeedbackView({ feedback, features }: { feedback: WritingFeedback; features: PlanFeatures }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-slate-950 text-white">
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">AI examiner summary</p><p className="mt-3 max-w-3xl leading-7 text-slate-300">{feedback.summary}</p></div>
          {features.bandScore && <div className="w-fit rounded-2xl bg-red-500/10 px-6 py-4 text-center ring-1 ring-red-400/20"><p className="text-xs font-semibold text-red-300">Overall Band Score</p><p className="mt-1 text-4xl font-black text-red-400">{feedback.overallBand.toFixed(1)}</p></div>}
        </div>
      </Card>

      {features.criteria && <section><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h2 className="font-semibold">4 IELTS criteria</h2></div><div className="grid gap-4 xl:grid-cols-2">{feedback.criteria.map((criterion) => <Card key={criterion.name} className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Criterion</p><h3 className="mt-1 font-semibold">{criterion.name}</h3></div><Badge className="bg-red-50 text-red-600">Band {criterion.band.toFixed(1)}</Badge></div><p className="mt-4 text-sm leading-6 text-slate-600">{criterion.explanation}</p>{criterion.mistakes.length > 0 && <div className="mt-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />Mistakes</p><ul className="mt-2 space-y-2 text-sm text-slate-600">{criterion.mistakes.map((mistake) => <li key={mistake} className="rounded-xl bg-amber-50/70 p-3">{mistake}</li>)}</ul></div>}<div className="mt-5 rounded-xl bg-emerald-50/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Correction</p><p className="mt-2 text-sm leading-6 text-emerald-950">{criterion.correction}</p></div></Card>)}</div></section>}

      {features.errorCorrection && feedback.errorCorrection && feedback.errorCorrection.length > 0 && <section><div className="mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /><h2 className="font-semibold">Error correction</h2></div><Card className="divide-y overflow-hidden">{feedback.errorCorrection.map((item, index) => <div key={`${item.original}-${index}`} className="grid gap-3 p-5 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-red-500">Original</p><p className="mt-2 text-sm leading-6 text-slate-700">{item.original}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Corrected</p><p className="mt-2 text-sm leading-6 text-slate-700">{item.corrected}</p><p className="mt-2 text-xs leading-5 text-slate-400">{item.explanation}</p></div></div>)}</Card></section>}
      {features.band7Sample && feedback.band7Sample && <section><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="font-semibold">Band 7 sample answer</h2></div><Card className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-700">{feedback.band7Sample}</Card></section>}
      {features.improvedEssay && feedback.improvedEssay && <section><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="font-semibold">Full improved essay</h2></div><Card className="whitespace-pre-wrap p-6 text-sm leading-7 text-slate-700">{feedback.improvedEssay}</Card></section>}
      {features.nextBandGuidance && feedback.nextBandGuidance && feedback.nextBandGuidance.length > 0 && <section><div className="mb-4 flex items-center gap-2"><ArrowUpRight className="h-5 w-5" /><h2 className="font-semibold">Next-band guidance</h2></div><Card className="p-6"><ul className="space-y-3">{feedback.nextBandGuidance.map((tip) => <li key={tip} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />{tip}</li>)}</ul></Card></section>}
    </div>
  );
}
