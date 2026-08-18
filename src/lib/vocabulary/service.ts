import { prisma } from "@/lib/db/prisma";

export async function getLevelProgress(userId: string, level: "LEVEL_1" | "LEVEL_2") {
  const [total, learned] = await Promise.all([
    prisma.vocabularyItem.count({ where: { level } }),
    prisma.vocabularyItem.count({ where: { level, progress: { some: { userId, learned: true } } } })
  ]);
  return { total, learned };
}

export async function getVocabularyOverview(userId: string) {
  const [level1, level2] = await Promise.all([
    getLevelProgress(userId, "LEVEL_1"),
    getLevelProgress(userId, "LEVEL_2")
  ]);
  return { level1, level2 };
}

export async function getTopicsWithProgress(userId: string, level: "LEVEL_1" | "LEVEL_2") {
  const topics = await prisma.vocabularyTopic.findMany({
    where: { level },
    orderBy: [{ category: "asc" }, { order: "asc" }],
    include: { _count: { select: { items: true } } }
  });
  return Promise.all(topics.map(async (topic) => {
    const learned = await prisma.vocabularyItem.count({
      where: { topicId: topic.id, progress: { some: { userId, learned: true } } }
    });
    return { ...topic, total: topic._count.items, learned };
  }));
}

export async function getTopicVocabulary(
  userId: string,
  level: "LEVEL_1" | "LEVEL_2",
  slug: string,
  options: { filter: "all" | "learned" | "not-learned"; query: string }
) {
  const topic = await prisma.vocabularyTopic.findUnique({ where: { level_slug: { level, slug } } });
  if (!topic) return null;

  const baseWhere = { topicId: topic.id, ...(options.query ? { word: { contains: options.query, mode: "insensitive" as const } } : {}) };
  const filterWhere = options.filter === "learned"
    ? { progress: { some: { userId, learned: true } } }
    : options.filter === "not-learned"
      ? { progress: { none: { userId, learned: true } } }
      : {};

  const [items, total, learned] = await Promise.all([
    prisma.vocabularyItem.findMany({
      where: { ...baseWhere, ...filterWhere },
      orderBy: { word: "asc" },
      include: { progress: { where: { userId }, select: { learned: true } } }
    }),
    prisma.vocabularyItem.count({ where: { topicId: topic.id } }),
    prisma.vocabularyItem.count({ where: { topicId: topic.id, progress: { some: { userId, learned: true } } } })
  ]);
  return { topic, items, total, learned };
}
