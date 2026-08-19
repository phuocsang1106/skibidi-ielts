import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const features = {
  free: {
    bandScore: true,
    criteria: true,
    errorCorrection: true,
    band7Sample: false,
    improvedEssay: true,
    nextBandGuidance: false
  },
  paid: {
    bandScore: true,
    criteria: true,
    errorCorrection: true,
    band7Sample: true,
    improvedEssay: true,
    nextBandGuidance: true
  }
};

async function main() {
  const planRows = [
    { name: "Free", price: 0, aiRequestLimit: 1, aiModel: "openrouter/auto", features: features.free, isFree: true },
    { name: "Plus", price: 20000, aiRequestLimit: 3, aiModel: "openrouter/auto", features: features.paid, isFree: false },
    { name: "Pro", price: 50000, aiRequestLimit: 10, aiModel: "openrouter/auto", features: features.paid, isFree: false },
    { name: "Max", price: 100000, aiRequestLimit: 30, aiModel: "openrouter/auto", features: features.paid, isFree: false }
  ];

  for (const plan of planRows) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: { ...plan, durationDays: 30, isVisible: true }
    });
  }

  const group = await prisma.vocabularyGroup.upsert({
    where: { name: "Academic Vocabulary" },
    update: {},
    create: { name: "Academic Vocabulary" }
  });

  const topic = await prisma.vocabularyTopic.upsert({
    where: { groupId_name: { groupId: group.id, name: "Environment" } },
    update: {},
    create: { groupId: group.id, name: "Environment" }
  });

  const words = [
    ["sustainable", "able to continue without harming the environment", "Cities need sustainable transport systems.", "bền vững", ["viable", "eco-friendly"]],
    ["pollution", "harmful substances introduced into the environment", "Air pollution is a major public-health concern.", "ô nhiễm", ["contamination"]],
    ["biodiversity", "the variety of plant and animal life", "Deforestation threatens biodiversity worldwide.", "đa dạng sinh học", ["biological diversity"]]
  ] as const;

  for (const [word, meaning, example, translation, synonyms] of words) {
    await prisma.vocabularyWord.upsert({
      where: { topicId_word: { topicId: topic.id, word } },
      update: { meaning, example, translation, synonyms: [...synonyms] },
      create: { topicId: topic.id, word, meaning, example, translation, synonyms: [...synonyms] }
    });
  }

  await prisma.aISetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", defaultModel: "openrouter/auto" }
  });

  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword || adminPassword.length < 12) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD (minimum 12 characters) are required for seeding.");
  }
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.admin.upsert({
    where: { username: adminUsername.toLowerCase() },
    update: { passwordHash: adminHash },
    create: { username: adminUsername.toLowerCase(), passwordHash: adminHash }
  });

  console.log("Seed complete. Admin:", adminUsername);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
