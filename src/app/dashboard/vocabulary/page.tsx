import Link from "next/link";
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function TopicGrid({ topics }: { topics: Array<{ id: string; name: string; _count: { words: number } }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic) => (
        <Link key={topic.id} href={`/dashboard/vocabulary/${topic.id}`} className="group">
          <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-soft">
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold">{topic.name}</h3><p className="mt-1 text-sm text-slate-500">{topic._count.words} words</p></div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 transition group-hover:bg-slate-950 group-hover:text-white"><ArrowRight className="h-4 w-4" /></span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function VocabularyPage() {
  const groups = await prisma.vocabularyGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { topics: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { words: true } } } } }
  });

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Flashcards" title="Vocabulary" />
      {groups.length ? groups.map((group) => {
        const mainTopics = group.topics.filter((topic) => !topic.isSupplementary);
        const supplementaryTopics = group.topics.filter((topic) => topic.isSupplementary);
        return (
          <section key={group.id} className="space-y-5">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white"><BookOpen className="h-4 w-4" /></span><div><h2 className="font-semibold">{group.name}</h2><p className="text-xs text-slate-400">{group.topics.length} topics</p></div></div>
            {mainTopics.length > 0 && <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Main topics</p><TopicGrid topics={mainTopics} /></div>}
            {supplementaryTopics.length > 0 && <div className="pt-2"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400"><Layers3 className="h-3.5 w-3.5" />Supplementary topics</div><TopicGrid topics={supplementaryTopics} /></div>}
          </section>
        );
      }) : <EmptyState icon={BookOpen} title="No vocabulary yet" description="An admin can add groups, topics, and words from the admin panel." />}
    </div>
  );
}
