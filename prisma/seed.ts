import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for seeding");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const FEATURES = {
  BAND_SCORE: "BAND_SCORE",
  CRITERIA_BREAKDOWN: "CRITERIA_BREAKDOWN",
  ERROR_ANALYSIS: "ERROR_ANALYSIS",
  SENTENCE_IMPROVEMENTS: "SENTENCE_IMPROVEMENTS",
  PRIORITY_IMPROVEMENTS: "PRIORITY_IMPROVEMENTS",
  BAND7_SAMPLE: "BAND7_SAMPLE",
  DETAILED_CRITERION_ANALYSIS: "DETAILED_CRITERION_ANALYSIS",
  IMPROVED_ESSAY: "IMPROVED_ESSAY",
  NEXT_BAND_GUIDANCE: "NEXT_BAND_GUIDANCE",
  VOCAB_LEVEL_1: "VOCAB_LEVEL_1",
  VOCAB_LEVEL_2: "VOCAB_LEVEL_2",
  VOCAB_LEVEL_3: "VOCAB_LEVEL_3"
} as const;

const plans = [
  {
    slug: "free",
    displayName: "Free",
    description: "Try core vocabulary and AI Writing evaluation.",
    priceVnd: 0,
    durationDays: null,
    submissionLimit: 1,
    aiRequestsPerSubmission: 1,
    sortOrder: 0,
    badge: null,
    features: [FEATURES.BAND_SCORE, FEATURES.CRITERIA_BREAKDOWN, FEATURES.VOCAB_LEVEL_1]
  },
  {
    slug: "plus",
    displayName: "Plus",
    description: "More Writing practice with a two-stage AI pipeline.",
    priceVnd: 20000,
    durationDays: 30,
    submissionLimit: 5,
    aiRequestsPerSubmission: 2,
    sortOrder: 10,
    badge: null,
    features: [FEATURES.BAND_SCORE, FEATURES.CRITERIA_BREAKDOWN, FEATURES.ERROR_ANALYSIS, FEATURES.PRIORITY_IMPROVEMENTS, FEATURES.BAND7_SAMPLE, FEATURES.VOCAB_LEVEL_1, FEATURES.VOCAB_LEVEL_2]
  },
  {
    slug: "pro",
    displayName: "Pro",
    description: "Independent verification and richer feedback for serious practice.",
    priceVnd: 50000,
    durationDays: 30,
    submissionLimit: 10,
    aiRequestsPerSubmission: 3,
    sortOrder: 20,
    badge: "Popular",
    features: [FEATURES.BAND_SCORE, FEATURES.CRITERIA_BREAKDOWN, FEATURES.ERROR_ANALYSIS, FEATURES.SENTENCE_IMPROVEMENTS, FEATURES.PRIORITY_IMPROVEMENTS, FEATURES.BAND7_SAMPLE, FEATURES.DETAILED_CRITERION_ANALYSIS, FEATURES.NEXT_BAND_GUIDANCE, FEATURES.VOCAB_LEVEL_1, FEATURES.VOCAB_LEVEL_2, FEATURES.VOCAB_LEVEL_3]
  },
  {
    slug: "max",
    displayName: "Max",
    description: "Higher Writing quota with the verified grading pipeline.",
    priceVnd: 100000,
    durationDays: 30,
    submissionLimit: 25,
    aiRequestsPerSubmission: 3,
    sortOrder: 30,
    badge: null,
    features: Object.values(FEATURES)
  },
  {
    slug: "ultra",
    displayName: "Ultra",
    description: "Large Writing quota for intensive IELTS preparation.",
    priceVnd: 500000,
    durationDays: 90,
    submissionLimit: 100,
    aiRequestsPerSubmission: 3,
    sortOrder: 40,
    badge: "Intensive",
    features: Object.values(FEATURES)
  }
] as const;

const starterVocabulary = [
  {
    slug: "level-1",
    name: "Level 1",
    bandRange: "IELTS 3.5 → 5.0",
    requiredFeature: FEATURES.VOCAB_LEVEL_1,
    sortOrder: 10,
    topics: [
      {
        slug: "daily-life",
        name: "Daily Life",
        words: [
          ["routine", "/ruːˈtiːn/", "noun", "thói quen; lịch sinh hoạt", ["daily routine", "regular routine"], ["habit", "schedule"], "A regular study routine can improve your English over time."],
          ["convenient", "/kənˈviːniənt/", "adjective", "thuận tiện", ["convenient location", "highly convenient"], ["practical", "handy"], "Online learning is convenient for students with busy schedules."],
          ["afford", "/əˈfɔːd/", "verb", "có đủ khả năng chi trả", ["afford to buy", "cannot afford"], ["pay for", "manage"], "Many young people cannot afford to buy a house in large cities."],
          ["improve", "/ɪmˈpruːv/", "verb", "cải thiện", ["improve skills", "significantly improve"], ["enhance", "develop"], "Public transport should be improved to reduce traffic congestion."],
          ["reduce", "/rɪˈdjuːs/", "verb", "giảm", ["reduce costs", "reduce pollution"], ["decrease", "cut"], "Using renewable energy can reduce air pollution."]
        ]
      }
    ]
  },
  {
    slug: "level-2",
    name: "Level 2",
    bandRange: "IELTS 5.0 → 6.5",
    requiredFeature: FEATURES.VOCAB_LEVEL_2,
    sortOrder: 20,
    topics: [
      {
        slug: "education-society",
        name: "Education & Society",
        words: [
          ["curriculum", "/kəˈrɪkjələm/", "noun", "chương trình học", ["school curriculum", "national curriculum"], ["syllabus", "programme"], "Financial literacy should be included in the school curriculum."],
          ["inequality", "/ˌɪnɪˈkwɒləti/", "noun", "sự bất bình đẳng", ["income inequality", "social inequality"], ["disparity", "imbalance"], "Improving access to education may help reduce social inequality."],
          ["allocate", "/ˈæləkeɪt/", "verb", "phân bổ", ["allocate resources", "allocate funding"], ["assign", "distribute"], "Governments should allocate more funding to public schools."],
          ["significant", "/sɪɡˈnɪfɪkənt/", "adjective", "đáng kể; quan trọng", ["significant increase", "significant impact"], ["considerable", "substantial"], "The chart shows a significant increase in internet use."],
          ["contribute", "/kənˈtrɪbjuːt/", "verb", "đóng góp; góp phần", ["contribute to", "make a contribution"], ["add to", "support"], "Heavy traffic contributes to poor air quality in urban areas."]
        ]
      }
    ]
  },
  {
    slug: "level-3",
    name: "Level 3",
    bandRange: "IELTS 6.5+",
    requiredFeature: FEATURES.VOCAB_LEVEL_3,
    sortOrder: 30,
    topics: [
      {
        slug: "academic-argument",
        name: "Academic Argument",
        words: [
          ["exacerbate", "/ɪɡˈzæsəbeɪt/", "verb", "làm trầm trọng thêm", ["exacerbate a problem", "exacerbate inequality"], ["worsen", "aggravate"], "Poorly planned urban growth can exacerbate housing shortages."],
          ["mitigate", "/ˈmɪtɪɡeɪt/", "verb", "giảm nhẹ; hạn chế tác động", ["mitigate risks", "mitigate the impact"], ["alleviate", "reduce"], "Targeted subsidies can mitigate the impact of rising energy prices."],
          ["disproportionate", "/ˌdɪsprəˈpɔːʃənət/", "adjective", "không cân xứng", ["disproportionate impact", "disproportionate share"], ["unequal", "imbalanced"], "Climate change can have a disproportionate impact on low-income communities."],
          ["plausible", "/ˈplɔːzəbl/", "adjective", "hợp lý; có vẻ đáng tin", ["plausible explanation", "plausible argument"], ["credible", "reasonable"], "A plausible explanation is that remote work has reduced commuting demand."],
          ["counterproductive", "/ˌkaʊntəprəˈdʌktɪv/", "adjective", "phản tác dụng", ["prove counterproductive", "potentially counterproductive"], ["self-defeating", "ineffective"], "An overly strict policy may be counterproductive if it discourages innovation."]
        ]
      }
    ]
  }
] as const;

async function seedPlans() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: { ...plan, defaultModel: process.env.OPENROUTER_MODEL || null }
    });
  }
}

async function seedVocabulary() {
  for (const level of starterVocabulary) {
    const createdLevel = await prisma.vocabularyLevel.upsert({
      where: { slug: level.slug },
      update: {},
      create: { slug: level.slug, name: level.name, bandRange: level.bandRange, requiredFeature: level.requiredFeature, sortOrder: level.sortOrder }
    });

    for (const topic of level.topics) {
      const createdTopic = await prisma.vocabularyTopic.upsert({
        where: { levelId_slug: { levelId: createdLevel.id, slug: topic.slug } },
        update: {},
        create: { levelId: createdLevel.id, slug: topic.slug, name: topic.name }
      });

      let sortOrder = 0;
      for (const [word, ipa, partOfSpeech, vietnameseMeaning, collocations, synonyms, exampleSentence] of topic.words) {
        sortOrder += 10;
        await prisma.vocabularyWord.upsert({
          where: { topicId_word: { topicId: createdTopic.id, word } },
          update: {},
          create: { topicId: createdTopic.id, word, ipa, partOfSpeech, vietnameseMeaning, collocations: [...collocations], synonyms: [...synonyms], exampleSentence, sortOrder }
        });
      }
    }
  }
}

async function seedSettings() {
  await prisma.appSetting.upsert({
    where: { key: "PAYMENT_BANK" },
    update: {},
    create: {
      key: "PAYMENT_BANK",
      value: {
        configured: false,
        bankName: "",
        accountNumber: "",
        accountName: "",
        qrTemplate: "compact",
        qrUrlTemplate: ""
      }
    }
  });
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.log("Admin seed skipped. Set ADMIN_USERNAME and ADMIN_PASSWORD to create the initial admin safely.");
    return;
  }
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters");
  const normalizedUsername = username.toLowerCase();
  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { normalizedUsername },
    update: { role: UserRole.ADMIN },
    create: { username, normalizedUsername, passwordHash, role: UserRole.ADMIN }
  });
}

async function main() {
  await seedPlans();
  await seedVocabulary();
  await seedSettings();
  await seedAdmin();
  console.log("Skibidi IELTS V2 seed complete.");
}

main().finally(async () => prisma.$disconnect());
