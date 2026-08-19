import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getOperationalPlanForUser } from "@/lib/services/plans";

export async function vocabularyLevelsForUser(userId: string) {
  const { features } = await getOperationalPlanForUser(userId);
  const levels = await prisma.vocabularyLevel.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { topics: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { words: { where: { isActive: true } } } } } } }
  });
  return Promise.all(levels.map(async (level) => {
    const total = await prisma.vocabularyWord.count({ where: { isActive: true, topic: { levelId: level.id } } });
    const learned = await prisma.userVocabularyProgress.count({ where: { userId, status: "LEARNED", word: { isActive: true, topic: { levelId: level.id } } } });
    const entitled = !level.requiredFeature || features.includes(level.requiredFeature);
    const topics = level.topics.map((topic) => ({
      ...topic,
      entitled: entitled && (!topic.requiredFeature || features.includes(topic.requiredFeature))
    }));
    return { ...level, topics, total, learned, entitled };
  }));
}

export async function vocabularyTopicForUser(userId: string, levelSlug: string, topicSlug: string) {
  const { features } = await getOperationalPlanForUser(userId);
  const topic = await prisma.vocabularyTopic.findFirst({
    where: { slug: topicSlug, isActive: true, level: { slug: levelSlug, isActive: true } },
    include: {
      level: true,
      words: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { progress: { where: { userId }, select: { status: true } } } }
    }
  });
  if (!topic) throw new AppError("VOCAB_TOPIC_NOT_FOUND", "Vocabulary topic not found.", 404);
  if (topic.level.requiredFeature && !features.includes(topic.level.requiredFeature)) throw new AppError("VOCAB_NOT_ENTITLED", "Vocabulary level is not included in this plan.", 403);
  if (topic.requiredFeature && !features.includes(topic.requiredFeature)) throw new AppError("VOCAB_NOT_ENTITLED", "Vocabulary topic is not included in this plan.", 403);
  return topic;
}
