import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";

const topics = [
  ["Education", "education", "CORE"], ["Environment", "environment", "CORE"], ["Health", "health", "CORE"], ["Technology", "technology", "CORE"],
  ["Work & Employment", "work-employment", "CORE"], ["Society & Social Issues", "society-social-issues", "CORE"], ["Cities & Urbanisation", "cities-urbanisation", "CORE"], ["Science & Research", "science-research", "CORE"],
  ["Economy & Money", "economy-money", "CORE"], ["Transport", "transport", "CORE"], ["Crime & Law", "crime-law", "CORE"], ["Media & Communication", "media-communication", "CORE"],
  ["Food & Agriculture", "food-agriculture", "ADDITIONAL"], ["Tourism & Travel", "tourism-travel", "ADDITIONAL"], ["Culture & Tradition", "culture-tradition", "ADDITIONAL"],
  ["Animals & Wildlife", "animals-wildlife", "ADDITIONAL"], ["Housing", "housing", "ADDITIONAL"], ["Energy & Natural Resources", "energy-natural-resources", "ADDITIONAL"]
] as const;

type SeedEntry = { word: string; ipa: string; vi: string; definition: string; collocations: string[] };
type TopicWords = { l1: SeedEntry[]; l2: SeedEntry[] };
const e = (word: string, ipa: string, vi: string, definition: string, ...collocations: string[]): SeedEntry => ({ word, ipa, vi, definition, collocations });

const words: Record<string, TopicWords> = {
  "education": {
    l1: [e("curriculum", "/kəˈrɪkjələm/", "chương trình học", "the subjects and content taught in a school or course", "school curriculum", "national curriculum"), e("literacy", "/ˈlɪtərəsi/", "khả năng đọc viết", "the ability to read and write", "literacy rate", "digital literacy")],
    l2: [e("pedagogy", "/ˈpedəɡɒdʒi/", "phương pháp giảng dạy", "the methods and principles used in teaching", "modern pedagogy", "teaching pedagogy"), e("attainment", "/əˈteɪnmənt/", "thành tích đạt được", "the level of achievement reached, especially in education", "educational attainment", "attainment gap")]
  },
  "environment": {
    l1: [e("pollution", "/pəˈluːʃən/", "ô nhiễm", "damage caused when harmful substances enter the environment", "air pollution", "water pollution"), e("habitat", "/ˈhæbɪtæt/", "môi trường sống", "the natural place where an animal or plant lives", "natural habitat", "habitat loss")],
    l2: [e("degradation", "/ˌdeɡrəˈdeɪʃən/", "sự suy thoái", "a process in which something becomes worse in quality or condition", "environmental degradation", "land degradation"), e("biodiversity", "/ˌbaɪəʊdaɪˈvɜːsəti/", "đa dạng sinh học", "the variety of plant and animal life in an area", "protect biodiversity", "biodiversity loss")]
  },
  "health": {
    l1: [e("nutrition", "/njuːˈtrɪʃən/", "dinh dưỡng", "the process of getting the food needed for health and growth", "good nutrition", "nutrition education"), e("obesity", "/əʊˈbiːsəti/", "béo phì", "a medical condition involving an excessive amount of body fat", "childhood obesity", "obesity rate")],
    l2: [e("prevalence", "/ˈprevələns/", "mức độ phổ biến", "the fact of being common within a population", "disease prevalence", "high prevalence"), e("mortality", "/mɔːˈtæləti/", "tỷ lệ tử vong", "the number of deaths in a particular population or period", "mortality rate", "infant mortality")]
  },
  "technology": {
    l1: [e("device", "/dɪˈvaɪs/", "thiết bị", "a piece of equipment made for a particular purpose", "digital device", "mobile device"), e("privacy", "/ˈprɪvəsi/", "quyền riêng tư", "the state of being free from unwanted observation or access to personal information", "data privacy", "privacy concerns")],
    l2: [e("algorithm", "/ˈælɡərɪðəm/", "thuật toán", "a set of rules used by a computer to solve a problem or process data", "search algorithm", "recommendation algorithm"), e("surveillance", "/səˈveɪləns/", "sự giám sát", "close observation of people or places, often using technology", "digital surveillance", "mass surveillance")]
  },
  "work-employment": {
    l1: [e("workforce", "/ˈwɜːkfɔːs/", "lực lượng lao động", "all the people who work for a company, industry or country", "skilled workforce", "global workforce"), e("unemployment", "/ˌʌnɪmˈplɔɪmənt/", "thất nghiệp", "the state of not having a job while being available for work", "unemployment rate", "youth unemployment")],
    l2: [e("productivity", "/ˌprɒdʌkˈtɪvəti/", "năng suất", "the rate at which work or goods are produced", "labour productivity", "increase productivity"), e("redundancy", "/rɪˈdʌndənsi/", "tình trạng mất việc do dư thừa nhân sự", "the loss of a job because the position is no longer needed", "compulsory redundancy", "redundancy payment")]
  },
  "society-social-issues": {
    l1: [e("poverty", "/ˈpɒvəti/", "nghèo đói", "the condition of having very little money or resources", "extreme poverty", "poverty reduction"), e("inequality", "/ˌɪnɪˈkwɒləti/", "bất bình đẳng", "an unfair difference in status, wealth or opportunity", "income inequality", "social inequality")],
    l2: [e("marginalisation", "/ˌmɑːdʒɪnəlaɪˈzeɪʃən/", "sự gạt ra bên lề xã hội", "the process of giving a person or group little power or importance", "social marginalisation", "economic marginalisation"), e("cohesion", "/kəʊˈhiːʒən/", "sự gắn kết", "the state of a group being united and connected", "social cohesion", "community cohesion")]
  },
  "cities-urbanisation": {
    l1: [e("urbanisation", "/ˌɜːbənaɪˈzeɪʃən/", "đô thị hóa", "the growth of cities as more people move into urban areas", "rapid urbanisation", "urbanisation rate"), e("density", "/ˈdensəti/", "mật độ", "the number of people or things within a particular area", "population density", "high density")],
    l2: [e("gentrification", "/ˌdʒentrɪfɪˈkeɪʃən/", "quá trình nâng cấp khu phố làm tăng giá và thay đổi cư dân", "the transformation of an urban area as wealthier residents and businesses move in", "urban gentrification", "gentrification process"), e("municipality", "/mjuːˌnɪsɪˈpæləti/", "đô thị hoặc chính quyền đô thị", "a town, city or district with its own local government", "local municipality", "municipal authority")]
  },
  "science-research": {
    l1: [e("experiment", "/ɪkˈsperɪmənt/", "thí nghiệm", "a scientific test carried out to discover or prove something", "controlled experiment", "laboratory experiment"), e("evidence", "/ˈevɪdəns/", "bằng chứng", "facts or information that support a conclusion", "scientific evidence", "strong evidence")],
    l2: [e("methodology", "/ˌmeθəˈdɒlədʒi/", "phương pháp nghiên cứu", "a system of methods used in a particular field of study", "research methodology", "experimental methodology"), e("validity", "/vəˈlɪdəti/", "độ hợp lệ", "the extent to which a method or result accurately measures what it claims to measure", "study validity", "external validity")]
  },
  "economy-money": {
    l1: [e("income", "/ˈɪnkʌm/", "thu nhập", "money received from work, business or investments", "household income", "income level"), e("inflation", "/ɪnˈfleɪʃən/", "lạm phát", "a general rise in prices that reduces the value of money", "inflation rate", "rising inflation")],
    l2: [e("expenditure", "/ɪkˈspendɪtʃə/", "chi tiêu", "the amount of money spent by a person, organisation or government", "public expenditure", "consumer expenditure"), e("recession", "/rɪˈseʃən/", "suy thoái kinh tế", "a period when economic activity declines significantly", "economic recession", "severe recession")]
  },
  "transport": {
    l1: [e("vehicle", "/ˈviːəkl/", "phương tiện", "a machine used to transport people or goods", "private vehicle", "electric vehicle"), e("pedestrian", "/pəˈdestriən/", "người đi bộ", "a person who is walking, especially near roads or traffic", "pedestrian safety", "pedestrian area")],
    l2: [e("mobility", "/məʊˈbɪləti/", "khả năng di chuyển", "the ability of people or goods to move from place to place", "urban mobility", "social mobility"), e("logistics", "/ləˈdʒɪstɪks/", "hậu cần vận chuyển", "the organisation of transporting and supplying goods", "transport logistics", "logistics network")]
  },
  "crime-law": {
    l1: [e("crime", "/kraɪm/", "tội phạm; tội ác", "an illegal act that can be punished by law", "violent crime", "crime rate"), e("punishment", "/ˈpʌnɪʃmənt/", "hình phạt", "a penalty given for breaking a law or rule", "severe punishment", "criminal punishment")],
    l2: [e("deterrence", "/dɪˈterəns/", "sự răn đe", "the prevention of an action by making its consequences seem undesirable", "crime deterrence", "deterrence effect"), e("prosecution", "/ˌprɒsɪˈkjuːʃən/", "việc truy tố", "the legal process of formally accusing and trying someone for a crime", "criminal prosecution", "successful prosecution")]
  },
  "media-communication": {
    l1: [e("audience", "/ˈɔːdiəns/", "khán giả; độc giả", "the group of people who watch, read or listen to something", "target audience", "mass audience"), e("broadcast", "/ˈbrɔːdkɑːst/", "chương trình phát sóng", "a programme sent out on television, radio or another medium", "news broadcast", "live broadcast")],
    l2: [e("censorship", "/ˈsensəʃɪp/", "kiểm duyệt", "the control or suppression of information considered unacceptable", "media censorship", "government censorship"), e("misinformation", "/ˌmɪsɪnfəˈmeɪʃən/", "thông tin sai lệch", "false or inaccurate information, whether or not it is shared deliberately", "online misinformation", "spread misinformation")]
  },
  "food-agriculture": {
    l1: [e("crop", "/krɒp/", "cây trồng; vụ mùa", "a plant grown in large quantities for food or other use", "food crop", "crop production"), e("harvest", "/ˈhɑːvɪst/", "vụ thu hoạch", "the collection of crops when they are ready", "annual harvest", "crop harvest")],
    l2: [e("irrigation", "/ˌɪrɪˈɡeɪʃən/", "tưới tiêu", "the artificial supply of water to land or crops", "irrigation system", "drip irrigation"), e("cultivation", "/ˌkʌltɪˈveɪʃən/", "sự canh tác", "the preparation and use of land for growing plants or crops", "crop cultivation", "land cultivation")]
  },
  "tourism-travel": {
    l1: [e("destination", "/ˌdestɪˈneɪʃən/", "điểm đến", "a place to which someone is travelling", "tourist destination", "popular destination"), e("accommodation", "/əˌkɒməˈdeɪʃən/", "chỗ ở", "a place where people stay temporarily", "tourist accommodation", "affordable accommodation")],
    l2: [e("ecotourism", "/ˈiːkəʊˌtʊərɪzəm/", "du lịch sinh thái", "tourism designed to minimise environmental harm and support local areas", "ecotourism development", "ecotourism project"), e("hospitality", "/ˌhɒspɪˈtæləti/", "ngành dịch vụ lưu trú và tiếp khách", "the business of providing food, drink and accommodation to visitors", "hospitality industry", "hospitality sector")]
  },
  "culture-tradition": {
    l1: [e("tradition", "/trəˈdɪʃən/", "truyền thống", "a belief or custom passed from one generation to another", "cultural tradition", "local tradition"), e("identity", "/aɪˈdentəti/", "bản sắc", "the qualities and beliefs that make a person or group distinct", "cultural identity", "national identity")],
    l2: [e("assimilation", "/əˌsɪməˈleɪʃən/", "sự đồng hóa", "the process by which a group becomes more similar to another culture or society", "cultural assimilation", "social assimilation"), e("authenticity", "/ˌɔːθenˈtɪsəti/", "tính xác thực", "the quality of being genuine rather than copied or artificial", "cultural authenticity", "question authenticity")]
  },
  "animals-wildlife": {
    l1: [e("species", "/ˈspiːʃiːz/", "loài", "a group of living organisms that share important characteristics", "endangered species", "native species"), e("extinction", "/ɪkˈstɪŋkʃən/", "sự tuyệt chủng", "the complete disappearance of a species", "mass extinction", "risk of extinction")],
    l2: [e("poaching", "/ˈpəʊtʃɪŋ/", "săn bắt trộm", "the illegal hunting or capture of wild animals", "wildlife poaching", "anti-poaching measures"), e("captivity", "/kæpˈtɪvəti/", "tình trạng nuôi nhốt", "the condition of being kept in a confined place rather than living freely", "animals in captivity", "captive breeding")]
  },
  "housing": {
    l1: [e("rent", "/rent/", "tiền thuê nhà", "money paid regularly for the use of a house, room or other property", "monthly rent", "rising rent"), e("household", "/ˈhaʊshəʊld/", "hộ gia đình", "the people who live together in one home", "household income", "household size")],
    l2: [e("affordability", "/əˌfɔːdəˈbɪləti/", "khả năng chi trả", "the degree to which something is cheap enough for people to pay for", "housing affordability", "affordability crisis"), e("tenancy", "/ˈtenənsi/", "việc thuê nhà; thời hạn thuê", "the legal arrangement or period in which someone rents a property", "tenancy agreement", "private tenancy")]
  },
  "energy-natural-resources": {
    l1: [e("electricity", "/ɪˌlekˈtrɪsəti/", "điện", "a form of energy used to provide power for machines, lighting and heating", "electricity demand", "electricity generation"), e("coal", "/kəʊl/", "than đá", "a black fossil fuel burned to produce heat and electricity", "coal mine", "coal consumption")],
    l2: [e("hydropower", "/ˈhaɪdrəʊˌpaʊə/", "thủy điện", "electricity generated by the movement of water", "hydropower plant", "hydropower generation"), e("depletion", "/dɪˈpliːʃən/", "sự cạn kiệt", "a reduction in the amount of a resource because it is being used up", "resource depletion", "ozone depletion")]
  }
};

function normalise(word: string) { return word.normalize("NFKC").trim().toLocaleLowerCase("en-US"); }

async function main() {
  const seen = new Set<string>();
  for (const [topicIndex, [name, slug, category]] of topics.entries()) {
    for (const level of ["LEVEL_1", "LEVEL_2"] as const) {
      const topic = await prisma.vocabularyTopic.upsert({
        where: { level_slug: { level, slug } },
        create: { name, slug, level, category, order: topicIndex + 1 },
        update: { name, category, order: topicIndex + 1 }
      });
      const entries = level === "LEVEL_1" ? words[slug].l1 : words[slug].l2;
      if (entries.length >= 80) throw new Error(`${name} ${level} must contain fewer than 80 words.`);
      for (const entry of entries) {
        const normalizedWord = normalise(entry.word);
        if (seen.has(normalizedWord)) throw new Error(`Duplicate vocabulary lemma across levels/topics: ${entry.word}`);
        seen.add(normalizedWord);
        await prisma.vocabularyItem.upsert({
          where: { normalizedWord },
          create: {
            topicId: topic.id, level, word: entry.word, normalizedWord, ipa: entry.ipa, partOfSpeech: "noun",
            vietnameseMeaning: entry.vi, readingDefinition: entry.definition,
            exampleSentence: `The passage discusses the role of ${entry.word} in ${name.toLowerCase()}.`,
            wordFamily: [entry.word], collocations: entry.collocations,
            audioMetadata: { provider: "speechSynthesis", locale: "en-GB" }
          },
          update: {
            topicId: topic.id, level, word: entry.word, ipa: entry.ipa, partOfSpeech: "noun", vietnameseMeaning: entry.vi,
            readingDefinition: entry.definition, exampleSentence: `The passage discusses the role of ${entry.word} in ${name.toLowerCase()}.`,
            wordFamily: [entry.word], collocations: entry.collocations, audioMetadata: { provider: "speechSynthesis", locale: "en-GB" }
          }
        });
      }
    }
  }
  console.log(`Seeded ${topics.length * 2} level-topic records and ${seen.size} distinct vocabulary items.`);
}

main().finally(async () => prisma.$disconnect());
