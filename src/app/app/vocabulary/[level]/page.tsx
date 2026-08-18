import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getTopicsWithProgress } from "@/lib/vocabulary/service";
import { ProgressBar } from "@/components/progress-bar";

function dbLevel(level: string) { return level === "level-1" ? "LEVEL_1" : level === "level-2" ? "LEVEL_2" : null; }
function state(learned: number, total: number) { return learned === 0 ? "Not started" : learned >= total && total > 0 ? "Completed" : "In progress"; }

export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params; const mapped = dbLevel(level); if (!mapped) notFound();
  const user = await requireUser(); const topics = await getTopicsWithProgress(user.id, mapped);
  const core = topics.filter(t => t.category === "CORE"); const additional = topics.filter(t => t.category === "ADDITIONAL");
  const title = mapped === "LEVEL_1" ? "Level 1 · IELTS 3.5 → 5.0" : "Level 2 · IELTS 5.0 → 6.5";
  const render = (items: typeof topics) => <div className="grid gap-3 md:grid-cols-2">{items.map(topic => <Link key={topic.id} href={`/app/vocabulary/${level}/${topic.slug}`} className="surface block p-4 hover:border-gray-300"><div className="flex items-start justify-between gap-3"><div className="font-medium">{topic.name}</div><span className="text-xs text-gray-500">{state(topic.learned, topic.total)}</span></div><div className="muted mt-2 text-sm">{topic.learned} / {topic.total} learned</div><div className="mt-2"><ProgressBar value={topic.learned} max={topic.total} /></div></Link>)}</div>;
  return <div><Link href="/app/vocabulary" className="text-sm text-gray-500">← Vocabulary</Link><h1 className="mt-5 text-2xl font-semibold">{title}</h1><section className="mt-8"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Core Topics</h2>{render(core)}</section><section className="mt-9"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Additional Topics</h2>{render(additional)}</section></div>;
}
