import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { FlashcardDeck } from "@/components/vocabulary/flashcard-deck";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export default async function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const topic = await prisma.vocabularyTopic.findUnique({ where: { id: topicId }, include: { group: true, words: { orderBy: { word: "asc" } } } });
  if (!topic) notFound();
  return <div className="space-y-8"><PageHeader eyebrow={topic.group.name} title={topic.name} action={<Badge>{topic.words.length} words</Badge>} />{topic.words.length ? <FlashcardDeck topic={topic.name} words={topic.words} /> : <EmptyState icon={BookOpen} title="This topic is empty" description="Ask an admin to add vocabulary words to this topic." />}</div>;
}
