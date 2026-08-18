import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getTopicVocabulary } from "@/lib/vocabulary/service";
import { vocabularyLevelFromSlug, VOCABULARY_LEVEL_META } from "@/lib/vocabulary/levels";
import { VocabularyFlashcards, type FlashcardItem } from "@/components/vocabulary-flashcards";

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function TopicPage({ params, searchParams }: { params: Promise<{ level: string; topic: string }>; searchParams: Promise<{ filter?: string }> }) {
  const [{ level, topic }, search] = await Promise.all([params, searchParams]);
  const mapped = vocabularyLevelFromSlug(level);
  if (!mapped) notFound();
  const filter = search.filter === "learned" || search.filter === "not-learned" ? search.filter : "all";
  const user = await requireUser();
  const data = await getTopicVocabulary(user.id, mapped, topic, { filter, query: "" });
  if (!data) notFound();
  const meta = VOCABULARY_LEVEL_META[mapped];
  const notLearned = data.total - data.learned;
  const items: FlashcardItem[] = data.items.map((item) => ({
    id: item.id,
    word: item.word,
    ipa: item.ipa,
    partOfSpeech: item.partOfSpeech,
    vietnameseMeaning: item.vietnameseMeaning,
    readingDefinition: item.readingDefinition,
    exampleSentence: item.exampleSentence,
    wordFamily: stringArray(item.wordFamily),
    collocations: stringArray(item.collocations),
    learned: item.progress[0]?.learned ?? false,
  }));

  const filters = [
    ["all", `All (${data.total})`],
    ["not-learned", `Not learned (${notLearned})`],
    ["learned", `Learned (${data.learned})`],
  ] as const;

  return (
    <div>
      <Link href={`/app/vocabulary/${level}`} className="back-link">← {meta.label}</Link>
      <div className="dashboard-row" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">{data.topic.name} — {meta.label}</h1>
          <div className="muted" style={{ marginTop: 7, fontSize: 13 }}>{data.learned} / {data.total} learned</div>
        </div>
      </div>
      <div className="progress-track" style={{ marginTop: 12 }}>
        <div className="progress-fill" style={{ width: `${data.total > 0 ? Math.min(100, Math.round((data.learned / data.total) * 100)) : 0}%` }} />
      </div>
      <div className="filter-row">
        {filters.map(([key, label]) => <Link key={key} href={`?filter=${key}`} className={`filter-chip${filter === key ? " active" : ""}`}>{label}</Link>)}
      </div>
      <VocabularyFlashcards items={items} />
    </div>
  );
}
