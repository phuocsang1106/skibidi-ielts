import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { VocabularyManager } from "@/components/admin/vocabulary-manager";

export default async function AdminVocabularyPage() {
  const [groups, topics] = await Promise.all([
    prisma.vocabularyGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    prisma.vocabularyTopic.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { words: true } } } })
  ]);
  return <div className="space-y-8"><PageHeader eyebrow="Content CMS" title="Vocabulary management" description="CRUD groups and topics, bulk-insert one word per line, then enrich each word with meaning, example, Vietnamese explanation, and synonyms." /><VocabularyManager groups={groups} topics={topics.map((topic) => ({ id: topic.id, groupId: topic.groupId, name: topic.name, wordCount: topic._count.words }))} /></div>;
}
