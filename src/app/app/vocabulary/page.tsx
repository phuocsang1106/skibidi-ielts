import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getVocabularyOverview } from "@/lib/vocabulary/service";

function LevelCard({ href, title, range, learned, total }: { href: string; title: string; range: string; learned: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0;
  return (
    <Link href={href} className="level-card">
      <h2>{title}</h2>
      <div className="meta">IELTS {range}</div>
      <div className="count">{learned} / {total} learned</div>
      <div className="progress-track" style={{ marginTop: 9 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
    </Link>
  );
}

export default async function VocabularyPage() {
  const user = await requireUser();
  const data = await getVocabularyOverview(user.id);
  return (
    <div>
      <h1 className="page-title">Vocabulary</h1>
      <div className="level-cards">
        <LevelCard href="/app/vocabulary/level-1" title="Level 1" range="3.5 → 5.0" {...data.level1} />
        <LevelCard href="/app/vocabulary/level-2" title="Level 2" range="5.0 → 6.5" {...data.level2} />
        <LevelCard href="/app/vocabulary/level-3" title="Level 3" range="6.5+" {...data.level3} />
      </div>
    </div>
  );
}
