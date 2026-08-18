import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getTopicsWithProgress } from "@/lib/vocabulary/service";
import { vocabularyLevelFromSlug, VOCABULARY_LEVEL_META } from "@/lib/vocabulary/levels";

function state(learned: number, total: number) {
  if (learned === 0) return "Not started";
  if (total > 0 && learned >= total) return "Completed";
  return "In progress";
}

export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const mapped = vocabularyLevelFromSlug(level);
  if (!mapped) notFound();
  const user = await requireUser();
  const topics = await getTopicsWithProgress(user.id, mapped);
  const core = topics.filter((topic) => topic.category === "CORE");
  const additional = topics.filter((topic) => topic.category === "ADDITIONAL");
  const meta = VOCABULARY_LEVEL_META[mapped];

  const renderTopics = (items: typeof topics) => (
    <div className="topic-grid">
      {items.map((topic) => {
        const pct = topic.total > 0 ? Math.min(100, Math.round((topic.learned / topic.total) * 100)) : 0;
        return (
          <Link key={topic.id} href={`/app/vocabulary/${level}/${topic.slug}`} className="topic-card">
            <div className="topic-card-top"><span className="topic-card-name">{topic.name}</span><span className="topic-state">{state(topic.learned, topic.total)}</span></div>
            <div className="topic-count">{topic.learned} / {topic.total} learned</div>
            <div className="progress-track" style={{ marginTop: 8 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      <Link href="/app/vocabulary" className="back-link">← Vocabulary</Link>
      <h1 className="page-title">{meta.label} · {meta.range}</h1>
      <div className="topic-section-label">Core Topics</div>
      {renderTopics(core)}
      <div className="topic-section-label">Additional Topics</div>
      {renderTopics(additional)}
    </div>
  );
}
