import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getVocabularyOverview } from "@/lib/vocabulary/service";
import { ProgressBar } from "@/components/progress-bar";

export default async function VocabularyPage() {
  const user = await requireUser();
  const data = await getVocabularyOverview(user.id);
  const levels = [
    { href: "/app/vocabulary/level-1", title: "Level 1", range: "IELTS 3.5 → 5.0", coverage: "Vocabulary coverage approximately to Band 5.5.", ...data.level1 },
    { href: "/app/vocabulary/level-2", title: "Level 2", range: "IELTS 5.0 → 6.5", coverage: "Vocabulary coverage approximately to Band 7.0.", ...data.level2 }
  ];
  return <div><h1 className="text-2xl font-semibold">Vocabulary</h1><p className="muted mt-2">Reading-focused vocabulary. Both levels are fully available.</p><div className="mt-7 grid gap-5 md:grid-cols-2">{levels.map(level => <Link href={level.href} key={level.title} className="surface block p-5 hover:border-gray-300"><div className="text-lg font-semibold">{level.title}</div><div className="mt-1 text-sm">{level.range}</div><p className="muted mt-3 text-sm">{level.coverage}</p><div className="mt-5 flex justify-between text-sm"><span>{level.learned} / {level.total} learned</span></div><div className="mt-2"><ProgressBar value={level.learned} max={level.total} /></div></Link>)}</div></div>;
}
