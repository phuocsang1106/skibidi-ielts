import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { vocabularyLevelsForUser } from "@/lib/services/vocabulary";

export default async function VocabularyPage() {
  const user = await requireUser();
  const levels = await vocabularyLevelsForUser(user.id);
  return <><PageHeader title="Vocabulary" description="Learn by level and topic. Your progress is saved word by word."/><div className="grid gap-4 lg:grid-cols-3">{levels.map((level)=>{
    const percent=level.total?Math.round(level.learned/level.total*100):0;
    return <article key={level.id} className="surface p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{level.name}</h2><p className="mt-1 text-sm text-zinc-500">{level.bandRange}</p></div>{!level.entitled&&<Lock size={18} className="text-zinc-400"/>}</div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full bg-zinc-900" style={{width:`${percent}%`}}/></div><div className="mt-2 flex justify-between text-xs text-zinc-500"><span>{level.learned}/{level.total} learned</span><span>{percent}%</span></div><div className="mt-5 space-y-2">{level.topics.slice(0,3).map((topic)=><div key={topic.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm"><span className="flex items-center gap-2">{topic.name}{!topic.entitled?<Lock size={13} className="text-zinc-400"/>:null}</span><span className="text-xs text-zinc-400">{topic._count.words} words</span></div>)}</div>{level.entitled&&level.topics.some(topic=>topic.entitled)?<Link className="btn btn-primary mt-5 w-full" href={`/app/vocabulary/${level.slug}/${level.topics.find(topic=>topic.entitled)!.slug}`}>Continue learning <ArrowRight size={15}/></Link>:<Link className="btn btn-secondary mt-5 w-full" href="/app/pricing">View plans</Link>}</article>})}</div></>;
}
