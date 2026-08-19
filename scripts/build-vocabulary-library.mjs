import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'prisma', 'vocabulary-data');
const baseFiles = ['group1.txt', 'group2.txt', 'group3.txt'];
const extraFiles = ['group1-extra.txt', 'group2-extra.txt', 'group3-extra.txt'];
const expectedCounts = { g1: 700, g2: 850, g3: 950 };

function parseFile(file, groupSort, collectTopics = true) {
  const lines = fs.readFileSync(path.join(dataDir, file), 'utf8').split(/\r?\n/);
  let group = null;
  let topic = null;
  const topics = [];
  const words = [];
  let topicSort = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith('//')) continue;
    if (raw.startsWith('@group|')) {
      const [, key, name] = raw.split('|');
      group = { key, name, sortOrder: groupSort };
      continue;
    }
    if (raw.startsWith('@topic|')) {
      if (!group) throw new Error(`${file}:${i + 1}: topic before group`);
      const [, name, kind] = raw.split('|');
      topicSort += 1;
      topic = { groupKey: group.key, groupName: group.name, name, isSupplementary: kind === 'supp', sortOrder: topicSort };
      if (collectTopics) topics.push(topic);
      continue;
    }
    if (!group || !topic) throw new Error(`${file}:${i + 1}: word before group/topic`);
    const parts = raw.split('|');
    if (parts.length !== 5) throw new Error(`${file}:${i + 1}: expected 5 fields, got ${parts.length}`);
    const [word, meaning, translation, example, synonymText] = parts.map((v) => v.trim());
    if (!word || !meaning || !translation || !example) throw new Error(`${file}:${i + 1}: missing required field`);
    const synonyms = synonymText ? synonymText.split(',').map((v) => v.trim()).filter(Boolean) : [];
    words.push({ groupKey: group.key, groupName: group.name, topicName: topic.name, word, meaning, translation, example, synonyms });
  }
  if (!group) throw new Error(`${file}: missing group`);
  return { group, topics, words };
}

const parsedBase = baseFiles.map((file, index) => parseFile(file, (index + 1) * 10, true));
const parsedExtra = extraFiles.map((file, index) => parseFile(file, (index + 1) * 10, false));
const groups = parsedBase.map((x) => x.group);
const topics = parsedBase.flatMap((x) => x.topics);
const baseWords = parsedBase.flatMap((x) => x.words);
const extraWords = parsedExtra.flatMap((x) => x.words);
const words = [...baseWords, ...extraWords];

function norm(value) {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/[-–—]/g, '-').replace(/\s+/g, ' ').trim();
}

for (const extra of parsedExtra) {
  const matchingGroup = groups.find((g) => g.key === extra.group.key && g.name === extra.group.name);
  if (!matchingGroup) throw new Error(`Expansion group mismatch: ${extra.group.key} / ${extra.group.name}`);
  for (const entry of extra.words) {
    if (!topics.some((t) => t.groupKey === entry.groupKey && t.name === entry.topicName)) {
      throw new Error(`Expansion references unknown topic: ${entry.groupKey}/${entry.topicName}`);
    }
  }
}

for (const group of groups) {
  const groupTopics = topics.filter((x) => x.groupKey === group.key);
  const core = groupTopics.filter((x) => !x.isSupplementary);
  const supp = groupTopics.filter((x) => x.isSupplementary);
  const groupWords = words.filter((x) => x.groupKey === group.key);
  if (core.length < 12 || core.length > 17) throw new Error(`${group.key}: main topics must be 12-17, got ${core.length}`);
  if (supp.length < 5 || supp.length > 10) throw new Error(`${group.key}: subtopics must be 5-10, got ${supp.length}`);
  if (groupWords.length !== expectedCounts[group.key]) throw new Error(`${group.key}: expected ${expectedCounts[group.key]} words, got ${groupWords.length}`);
}

const seen = new Map();
for (const entry of words) {
  const key = norm(entry.word);
  if (seen.has(key)) throw new Error(`Duplicate headword: ${entry.word} (${seen.get(key)} vs ${entry.groupKey}/${entry.topicName})`);
  seen.set(key, `${entry.groupKey}/${entry.topicName}`);
}
if (words.length !== 2500) throw new Error(`Expected 2500 total words, got ${words.length}`);

const library = { version: '2026-08-20-v5', methodology: 'Four-skill IELTS vocabulary expansion; 700/850/950 unique entries across three learning tiers.', groups, topics, words };
fs.writeFileSync(path.join(root, 'prisma', 'vocabulary-library.json'), `${JSON.stringify(library, null, 2)}\n`);

const q = (value) => value.replace(/\$json\$/g, '$ json $');
const wordJson = q(JSON.stringify(extraWords));
const migrationDir = path.join(root, 'prisma', 'migrations', '0004_vocab_four_skill_expansion');
fs.mkdirSync(migrationDir, { recursive: true });

const sql = `-- IELTS four-skill vocabulary expansion\n-- Adds 1,600 unique entries on top of the 900-entry band library.\n-- Existing users, plans, writing history and the original 0003 migration are untouched.\n\nWITH word_data AS (\n  SELECT * FROM jsonb_to_recordset($json$${wordJson}$json$::jsonb) AS x(\n    "groupKey" TEXT, "groupName" TEXT, "topicName" TEXT, "word" TEXT, "meaning" TEXT, "translation" TEXT, "example" TEXT, "synonyms" JSONB\n  )\n)\nINSERT INTO "VocabularyWord" ("id", "topicId", "word", "meaning", "example", "translation", "synonyms", "createdAt", "updatedAt")\nSELECT\n  'vw_' || md5(wd."groupKey" || '|' || wd."topicName" || '|' || lower(wd."word")),\n  t."id", wd."word", wd."meaning", wd."example", wd."translation",\n  ARRAY(SELECT jsonb_array_elements_text(wd."synonyms")), NOW(), NOW()\nFROM word_data wd\nJOIN "VocabularyGroup" g ON g."name" = wd."groupName"\nJOIN "VocabularyTopic" t ON t."groupId" = g."id" AND t."name" = wd."topicName"\nON CONFLICT ("topicId", "word") DO UPDATE SET\n  "meaning" = EXCLUDED."meaning",\n  "example" = EXCLUDED."example",\n  "translation" = EXCLUDED."translation",\n  "synonyms" = EXCLUDED."synonyms",\n  "updatedAt" = NOW();\n`;

fs.writeFileSync(path.join(migrationDir, 'migration.sql'), sql);
console.log(`Vocabulary library OK: ${groups.length} groups, ${topics.length} topics, ${words.length} unique headwords/phrases.`);
console.log(`Base: ${baseWords.length}; expansion: ${extraWords.length}.`);
for (const group of groups) {
  const groupTopics = topics.filter((x) => x.groupKey === group.key);
  const groupWords = words.filter((x) => x.groupKey === group.key);
  console.log(`${group.key}: ${groupTopics.filter((x) => !x.isSupplementary).length} main + ${groupTopics.filter((x) => x.isSupplementary).length} subtopics, ${groupWords.length} entries`);
}
