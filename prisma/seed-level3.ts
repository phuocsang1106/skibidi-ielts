import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";

const topics = [
  ["Education", "education", "CORE"],
  ["Environment", "environment", "CORE"],
  ["Health", "health", "CORE"],
  ["Technology", "technology", "CORE"],
  ["Work & Employment", "work-employment", "CORE"],
  ["Society & Social Issues", "society-social-issues", "CORE"],
  ["Cities & Urbanisation", "cities-urbanisation", "CORE"],
  ["Science & Research", "science-research", "CORE"],
  ["Economy & Money", "economy-money", "CORE"],
  ["Transport", "transport", "CORE"],
  ["Crime & Law", "crime-law", "CORE"],
  ["Media & Communication", "media-communication", "CORE"],
  ["Food & Agriculture", "food-agriculture", "ADDITIONAL"],
  ["Tourism & Travel", "tourism-travel", "ADDITIONAL"],
  ["Culture & Tradition", "culture-tradition", "ADDITIONAL"],
  ["Animals & Wildlife", "animals-wildlife", "ADDITIONAL"],
  ["Housing", "housing", "ADDITIONAL"],
  ["Energy & Natural Resources", "energy-natural-resources", "ADDITIONAL"],
] as const;

type Entry = {
  word: string;
  ipa: string;
  pos: string;
  vi: string;
  definition: string;
  example: string;
  family: string[];
  collocations: string[];
};

const e = (
  word: string,
  ipa: string,
  pos: string,
  vi: string,
  definition: string,
  example: string,
  family: string[],
  collocations: string[],
): Entry => ({ word, ipa, pos, vi, definition, example, family, collocations });

const data: Record<string, Entry[]> = {
  education: [
    e("accreditation", "/əˌkredɪˈteɪʃən/", "noun", "sự kiểm định, công nhận chất lượng", "official approval showing that an institution or course meets accepted standards", "Accreditation can help students identify institutions that meet recognised academic standards.", ["accredit", "accredited", "accreditation"], ["institutional accreditation", "accreditation standards"]),
    e("credentialism", "/krɪˈdenʃəlɪzəm/", "noun", "việc quá coi trọng bằng cấp", "an excessive reliance on formal qualifications when judging a person's ability or suitability", "Critics argue that credentialism may exclude capable applicants without formal degrees.", ["credential", "credentials", "credentialism"], ["academic credentials", "credentialism in recruitment"]),
  ],
  environment: [
    e("eutrophication", "/ˌjuːtrəfɪˈkeɪʃən/", "noun", "sự phú dưỡng", "the process in which excess nutrients cause rapid plant or algae growth in water", "Agricultural runoff can accelerate eutrophication in lakes and coastal waters.", ["eutrophic", "eutrophication"], ["lake eutrophication", "nutrient-driven eutrophication"]),
    e("anthropogenic", "/ˌænθrəpəˈdʒenɪk/", "adjective", "do con người gây ra", "caused or produced by human activity", "The report separates anthropogenic emissions from naturally occurring sources.", ["anthropogenic"], ["anthropogenic emissions", "anthropogenic climate change"]),
  ],
  health: [
    e("comorbidity", "/ˌkəʊmɔːˈbɪdəti/", "noun", "bệnh đồng mắc", "the presence of one or more additional medical conditions alongside a primary condition", "Older patients often require treatment plans that account for comorbidity.", ["comorbid", "comorbidity"], ["multiple comorbidities", "comorbidity burden"]),
    e("epidemiology", "/ˌepɪdiːmiˈɒlədʒi/", "noun", "dịch tễ học", "the study of how diseases and health conditions are distributed across populations", "Epidemiology helps researchers identify risk factors associated with disease outbreaks.", ["epidemiological", "epidemiologist", "epidemiology"], ["epidemiological evidence", "epidemiological study"]),
  ],
  technology: [
    e("interoperability", "/ˌɪntərˌɒpərəˈbɪləti/", "noun", "khả năng tương tác giữa các hệ thống", "the ability of different systems or technologies to exchange and use information together", "Interoperability is essential when hospitals use software supplied by different vendors.", ["interoperable", "interoperability"], ["system interoperability", "ensure interoperability"]),
    e("obsolescence", "/ˌɒbsəˈlesəns/", "noun", "sự lỗi thời", "the state of becoming outdated or no longer useful because something newer exists", "Rapid technological change can shorten product life cycles and increase obsolescence.", ["obsolete", "obsolescence"], ["planned obsolescence", "technological obsolescence"]),
  ],
  "work-employment": [
    e("remuneration", "/rɪˌmjuːnəˈreɪʃən/", "noun", "thù lao", "money or other payment received for work or services", "Executive remuneration is often linked to company performance.", ["remunerate", "remuneration"], ["competitive remuneration", "remuneration package"]),
    e("precarity", "/prɪˈkeərəti/", "noun", "tình trạng việc làm bấp bênh", "a condition of insecurity or instability, especially in employment and income", "Platform work has intensified concerns about employment precarity among younger workers.", ["precarious", "precariously", "precarity"], ["employment precarity", "economic precarity"]),
  ],
  "society-social-issues": [
    e("stratification", "/ˌstrætɪfɪˈkeɪʃən/", "noun", "sự phân tầng xã hội", "the division of society into groups with different levels of status, wealth or power", "Educational access can either reduce or reproduce social stratification.", ["stratify", "stratified", "stratification"], ["social stratification", "economic stratification"]),
    e("disenfranchisement", "/ˌdɪsɪnˈfræntʃaɪzmənt/", "noun", "sự tước quyền, gạt ra khỏi quyền tham gia", "the removal or absence of rights, influence or meaningful participation", "Political disenfranchisement can weaken trust in public institutions.", ["disenfranchise", "disenfranchised", "disenfranchisement"], ["voter disenfranchisement", "social disenfranchisement"]),
  ],
  "cities-urbanisation": [
    e("agglomeration", "/əˌɡlɒməˈreɪʃən/", "noun", "sự tập trung thành cụm", "the concentration of people, firms or activities in a particular area", "Urban agglomeration can improve productivity when firms share infrastructure and labour markets.", ["agglomerate", "agglomeration"], ["urban agglomeration", "agglomeration economies"]),
    e("conurbation", "/ˌkɒnəˈbeɪʃən/", "noun", "vùng đô thị liên hợp", "a large continuous urban area formed when neighbouring towns or cities expand and merge", "Transport planning becomes more complex when separate cities develop into a conurbation.", ["conurbation"], ["large conurbation", "urban conurbation"]),
  ],
  "science-research": [
    e("reproducibility", "/rɪˌprəʊdjuːsəˈbɪləti/", "noun", "khả năng tái lập kết quả", "the extent to which a study or result can be obtained again using the same data or methods", "Open data can improve the reproducibility of computational research.", ["reproduce", "reproducible", "reproducibility"], ["research reproducibility", "improve reproducibility"]),
    e("falsifiability", "/ˌfɔːlsɪfaɪəˈbɪləti/", "noun", "tính có thể bị bác bỏ bằng kiểm chứng", "the quality of a claim or theory being testable in a way that could show it to be false", "Falsifiability is often discussed as an important feature of scientific hypotheses.", ["falsify", "falsifiable", "falsifiability"], ["scientific falsifiability", "criterion of falsifiability"]),
  ],
  "economy-money": [
    e("liquidity", "/lɪˈkwɪdəti/", "noun", "tính thanh khoản", "the availability of cash or assets that can quickly be converted into cash", "Banks must maintain sufficient liquidity to meet short-term obligations.", ["liquid", "liquidity"], ["market liquidity", "liquidity risk"]),
    e("solvency", "/ˈsɒlvənsi/", "noun", "khả năng thanh toán dài hạn", "the ability of a person or organisation to meet long-term financial obligations", "Regulators monitor bank solvency as well as short-term liquidity.", ["solvent", "insolvent", "solvency"], ["financial solvency", "solvency ratio"]),
  ],
  transport: [
    e("intermodality", "/ˌɪntəməʊˈdæləti/", "noun", "tính liên kết nhiều phương thức vận tải", "the coordinated use of more than one form of transport within a journey or freight system", "Better intermodality can make public transport more convenient for commuters.", ["intermodal", "intermodality"], ["transport intermodality", "intermodal network"]),
    e("ridership", "/ˈraɪdəʃɪp/", "noun", "lượng hành khách sử dụng phương tiện công cộng", "the number of passengers using a public transport service", "Rail ridership increased after the city introduced integrated ticketing.", ["rider", "ridership"], ["public transport ridership", "increase ridership"]),
  ],
  "crime-law": [
    e("recidivism", "/rɪˈsɪdɪvɪzəm/", "noun", "tình trạng tái phạm", "the tendency of a convicted person to commit another offence after punishment or release", "Education programmes in prison may help reduce recidivism.", ["recidivist", "recidivism"], ["recidivism rate", "reduce recidivism"]),
    e("jurisprudence", "/ˌdʒʊərɪsˈpruːdəns/", "noun", "lý luận và triết học pháp luật", "the theory, philosophy and interpretation of law", "The judgment influenced later jurisprudence on privacy rights.", ["jurisprudence", "jurisprudential"], ["legal jurisprudence", "constitutional jurisprudence"]),
  ],
  "media-communication": [
    e("sensationalism", "/senˈseɪʃənəlɪzəm/", "noun", "khuynh hướng giật gân", "the presentation of information in an exaggerated or shocking way to attract attention", "Media sensationalism can distort public perceptions of rare events.", ["sensational", "sensationalise", "sensationalism"], ["media sensationalism", "sensationalist reporting"]),
    e("dissemination", "/dɪˌsemɪˈneɪʃən/", "noun", "sự phổ biến, truyền bá thông tin", "the act of spreading information, knowledge or ideas widely", "Digital platforms have accelerated the dissemination of scientific findings.", ["disseminate", "dissemination"], ["information dissemination", "dissemination strategy"]),
  ],
  "food-agriculture": [
    e("monoculture", "/ˈmɒnəʊˌkʌltʃə/", "noun", "độc canh", "the practice of growing a single crop over a large area or for repeated seasons", "Monoculture can increase efficiency but may leave farms more vulnerable to pests.", ["monoculture"], ["intensive monoculture", "monoculture farming"]),
    e("salinisation", "/ˌsælɪnaɪˈzeɪʃən/", "noun", "sự nhiễm mặn", "the process by which salt accumulates in soil or water", "Poor irrigation management can contribute to soil salinisation.", ["saline", "salinity", "salinisation"], ["soil salinisation", "secondary salinisation"]),
  ],
  "tourism-travel": [
    e("commodification", "/kəˌmɒdɪfɪˈkeɪʃən/", "noun", "sự thương mại hóa thành hàng hóa", "the process of turning something, including culture or experience, into a product that can be sold", "Tourism may lead to the commodification of local traditions.", ["commodity", "commodify", "commodification"], ["cultural commodification", "tourism commodification"]),
    e("seasonality", "/ˌsiːzəˈnæləti/", "noun", "tính thời vụ", "regular variation in activity or demand according to the season", "Seasonality creates unstable employment in many coastal tourism destinations.", ["seasonal", "seasonally", "seasonality"], ["tourism seasonality", "seasonal demand"]),
  ],
  "culture-tradition": [
    e("acculturation", "/əˌkʌltʃəˈreɪʃən/", "noun", "sự tiếp biến văn hóa", "the process of cultural change resulting from sustained contact between different groups", "Migration can produce different patterns of acculturation across generations.", ["acculturate", "acculturation"], ["cultural acculturation", "acculturation process"]),
    e("preservation", "/ˌprezəˈveɪʃən/", "noun", "sự bảo tồn", "the protection of something so that it continues to exist in its present or valued form", "Heritage preservation may require limits on commercial development in historic areas.", ["preserve", "preserved", "preservation"], ["heritage preservation", "cultural preservation"]),
  ],
  "animals-wildlife": [
    e("endemism", "/ˈendəmɪzəm/", "noun", "tính đặc hữu", "the condition of a species being naturally restricted to a particular geographic area", "Island ecosystems often show high levels of endemism.", ["endemic", "endemism"], ["species endemism", "high endemism"]),
    e("reintroduction", "/ˌriːɪntrəˈdʌkʃən/", "noun", "sự tái thả loài về môi trường tự nhiên", "the deliberate release of a species into an area where it previously lived", "Successful reintroduction requires suitable habitat and long-term monitoring.", ["reintroduce", "reintroduction"], ["species reintroduction", "wildlife reintroduction"]),
  ],
  housing: [
    e("displacement", "/dɪsˈpleɪsmənt/", "noun", "sự buộc phải di dời", "the forced or indirect movement of people away from their homes or communities", "Rising property values can contribute to the displacement of lower-income residents.", ["displace", "displaced", "displacement"], ["residential displacement", "forced displacement"]),
    e("overcrowding", "/ˌəʊvəˈkraʊdɪŋ/", "noun", "tình trạng quá đông người trong nhà ở", "a situation in which too many people live in a space that is too small", "Housing overcrowding is associated with several health and social risks.", ["overcrowd", "overcrowded", "overcrowding"], ["housing overcrowding", "severe overcrowding"]),
  ],
  "energy-natural-resources": [
    e("decarbonisation", "/diːˌkɑːbənaɪˈzeɪʃən/", "noun", "quá trình khử carbon", "the process of reducing carbon emissions from an economy, industry or energy system", "Power-sector decarbonisation depends on cleaner generation and grid investment.", ["decarbonise", "decarbonised", "decarbonisation"], ["energy decarbonisation", "decarbonisation pathway"]),
    e("intermittency", "/ˌɪntəˈmɪtənsi/", "noun", "tính gián đoạn, không liên tục", "the quality of occurring irregularly or stopping and starting rather than being continuous", "Energy storage can help manage the intermittency of wind and solar generation.", ["intermittent", "intermittently", "intermittency"], ["renewable intermittency", "manage intermittency"]),
  ],
};

function normalizeWord(word: string) {
  return word.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

async function main() {
  let insertedOrUpdated = 0;

  for (const [topicIndex, [name, slug, category]] of topics.entries()) {
    const topic = await prisma.vocabularyTopic.upsert({
      where: { level_slug: { level: "LEVEL_3", slug } },
      create: { name, slug, level: "LEVEL_3", category, order: topicIndex + 1 },
      update: { name, category, order: topicIndex + 1 },
    });

    const entries = data[slug] ?? [];
    if (entries.length >= 80) {
      throw new Error(`${name} LEVEL_3 must contain fewer than 80 words.`);
    }

    for (const entry of entries) {
      const normalizedWord = normalizeWord(entry.word);
      const existing = await prisma.vocabularyItem.findUnique({
        where: { normalizedWord },
        select: { id: true, level: true, topicId: true },
      });

      if (existing && existing.level !== "LEVEL_3") {
        throw new Error(
          `Level 3 lemma already exists in ${existing.level}: ${entry.word}`,
        );
      }

      await prisma.vocabularyItem.upsert({
        where: { normalizedWord },
        create: {
          topicId: topic.id,
          level: "LEVEL_3",
          word: entry.word,
          normalizedWord,
          ipa: entry.ipa,
          partOfSpeech: entry.pos,
          vietnameseMeaning: entry.vi,
          readingDefinition: entry.definition,
          exampleSentence: entry.example,
          wordFamily: entry.family,
          collocations: entry.collocations,
          audioMetadata: { provider: "speechSynthesis", locale: "en-GB" },
        },
        update: {
          topicId: topic.id,
          level: "LEVEL_3",
          word: entry.word,
          ipa: entry.ipa,
          partOfSpeech: entry.pos,
          vietnameseMeaning: entry.vi,
          readingDefinition: entry.definition,
          exampleSentence: entry.example,
          wordFamily: entry.family,
          collocations: entry.collocations,
          audioMetadata: { provider: "speechSynthesis", locale: "en-GB" },
        },
      });
      insertedOrUpdated += 1;
    }
  }

  console.log(
    `Level 3 seed complete: ${topics.length} topics, ${insertedOrUpdated} starter vocabulary items.`,
  );
}

main().finally(async () => prisma.$disconnect());
