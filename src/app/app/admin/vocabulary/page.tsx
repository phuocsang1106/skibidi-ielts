import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  deleteTopicAction,
  deleteVocabularyItemAction,
  saveTopicAction,
  saveVocabularyItemAction,
} from "@/lib/admin/actions";

type LevelValue = "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
type CategoryValue = "CORE" | "ADDITIONAL";

type TopicShape = {
  id: string;
  name: string;
  slug: string;
  level: LevelValue;
  category: CategoryValue;
  order: number;
};

type ItemShape = {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  vietnameseMeaning: string;
  readingDefinition: string;
  exampleSentence: string;
  wordFamily: unknown;
  collocations: unknown;
};

function csv(value: unknown) {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === "string").join(", ")
    : "";
}

function TopicForm({ topic }: { topic?: TopicShape }) {
  return (
    <form action={saveTopicAction} className="grid gap-3 md:grid-cols-5">
      <input type="hidden" name="topicId" value={topic?.id || ""} />
      <div>
        <label className="label">Name</label>
        <input className="input" name="name" defaultValue={topic?.name} required />
      </div>
      <div>
        <label className="label">Slug</label>
        <input className="input" name="slug" defaultValue={topic?.slug} />
      </div>
      <div>
        <label className="label">Level</label>
        <select className="input" name="level" defaultValue={topic?.level || "LEVEL_1"}>
          <option value="LEVEL_1">Level 1</option>
          <option value="LEVEL_2">Level 2</option>
          <option value="LEVEL_3">Level 3</option>
        </select>
      </div>
      <div>
        <label className="label">Category</label>
        <select className="input" name="category" defaultValue={topic?.category || "CORE"}>
          <option value="CORE">Core</option>
          <option value="ADDITIONAL">Additional</option>
        </select>
      </div>
      <div>
        <label className="label">Order</label>
        <div className="flex gap-2">
          <input className="input" type="number" name="order" defaultValue={topic?.order ?? 0} />
          <button className="btn-secondary">{topic ? "Save" : "Add"}</button>
        </div>
      </div>
    </form>
  );
}

function ItemForm({ topicId, item }: { topicId: string; item?: ItemShape }) {
  return (
    <form action={saveVocabularyItemAction} className="grid gap-3">
      <input type="hidden" name="itemId" value={item?.id || ""} />
      <input type="hidden" name="topicId" value={topicId} />
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="label">Word</label>
          <input className="input" name="word" defaultValue={item?.word} required />
        </div>
        <div>
          <label className="label">IPA</label>
          <input className="input" name="ipa" defaultValue={item?.ipa} required />
        </div>
        <div>
          <label className="label">Part of speech</label>
          <input className="input" name="partOfSpeech" defaultValue={item?.partOfSpeech} required />
        </div>
      </div>
      <div>
        <label className="label">Vietnamese meaning</label>
        <input className="input" name="vietnameseMeaning" defaultValue={item?.vietnameseMeaning} required />
      </div>
      <div>
        <label className="label">Reading definition</label>
        <textarea className="input" name="readingDefinition" defaultValue={item?.readingDefinition} required />
      </div>
      <div>
        <label className="label">Example sentence</label>
        <textarea className="input" name="exampleSentence" defaultValue={item?.exampleSentence} required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Word family (comma separated)</label>
          <input className="input" name="wordFamily" defaultValue={csv(item?.wordFamily)} />
        </div>
        <div>
          <label className="label">Collocations (comma separated)</label>
          <input className="input" name="collocations" defaultValue={csv(item?.collocations)} />
        </div>
      </div>
      <div>
        <button className="btn-primary">{item ? "Save vocabulary item" : "Add vocabulary item"}</button>
      </div>
    </form>
  );
}

export default async function AdminVocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string; q?: string }>;
}) {
  await requireAdmin();
  const { topicId = "", q = "" } = await searchParams;
  const topics = await prisma.vocabularyTopic.findMany({
    orderBy: [{ level: "asc" }, { category: "asc" }, { order: "asc" }],
  });
  const selected = topics.find((topic) => topic.id === topicId);
  const items = selected
    ? await prisma.vocabularyItem.findMany({
        where: {
          topicId: selected.id,
          ...(q ? { word: { contains: q, mode: "insensitive" } } : {}),
        },
        orderBy: { word: "asc" },
        take: 80,
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Vocabulary Admin</h1>
      <section className="surface mt-6 p-5">
        <h2 className="font-semibold">Add topic</h2>
        <div className="mt-4"><TopicForm /></div>
      </section>
      <section className="mt-6">
        <h2 className="font-semibold">Topics</h2>
        <div className="mt-3 space-y-2">
          {topics.map((topic) => (
            <details key={topic.id} className="surface p-4">
              <summary className="cursor-pointer">
                <span className="font-medium">{topic.name}</span>{" "}
                <span className="muted text-sm">· {topic.level} · {topic.category}</span>
              </summary>
              <div className="mt-4">
                <TopicForm topic={topic as TopicShape} />
                <div className="mt-3 flex gap-2">
                  <Link href={`/app/admin/vocabulary?topicId=${topic.id}`} className="btn-secondary">Manage words</Link>
                  <form action={deleteTopicAction}>
                    <input type="hidden" name="topicId" value={topic.id} />
                    <button className="btn-secondary">Delete topic</button>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
      {selected && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{selected.name} · {selected.level}</h2>
              <p className="muted mt-1 text-sm">Vocabulary entries must remain below 80 per topic.</p>
            </div>
            <form className="flex gap-2">
              <input type="hidden" name="topicId" value={selected.id} />
              <input className="input" name="q" defaultValue={q} placeholder="Search word" />
              <button className="btn-secondary">Search</button>
            </form>
          </div>
          <div className="surface mt-4 p-5">
            <h3 className="font-semibold">Add word</h3>
            <div className="mt-4"><ItemForm topicId={selected.id} /></div>
          </div>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <details key={item.id} className="surface p-4">
                <summary className="cursor-pointer">
                  <span className="font-semibold">{item.word}</span>{" "}
                  <span className="muted text-sm">· {item.ipa} · {item.partOfSpeech}</span>
                </summary>
                <div className="mt-4">
                  <ItemForm topicId={selected.id} item={item as ItemShape} />
                  <form action={deleteVocabularyItemAction} className="mt-3">
                    <input type="hidden" name="itemId" value={item.id} />
                    <button className="btn-secondary">Delete vocabulary item</button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
