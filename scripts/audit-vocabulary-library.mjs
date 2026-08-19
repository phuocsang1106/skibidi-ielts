import fs from 'node:fs';

const library = JSON.parse(fs.readFileSync('prisma/vocabulary-library.json', 'utf8'));
const issues = [];
const norm = (v) => v.toLowerCase().replace(/[’']/g, "'").replace(/[-–—]/g, '-').replace(/\s+/g, ' ').trim();
const seen = new Map();
const target = { g1: 700, g2: 850, g3: 950 };

for (const entry of library.words) {
  for (const field of ['word', 'meaning', 'translation', 'example']) {
    if (!entry[field] || !String(entry[field]).trim()) issues.push(`${entry.groupKey}/${entry.topicName}/${entry.word}: missing ${field}`);
  }
  const key = norm(entry.word);
  if (seen.has(key)) issues.push(`duplicate: ${entry.word} (${seen.get(key)} vs ${entry.groupKey}/${entry.topicName})`);
  else seen.set(key, `${entry.groupKey}/${entry.topicName}`);
  if (!/[.!?]$/.test(entry.example.trim())) issues.push(`${entry.word}: example lacks terminal punctuation`);
  if (entry.word.length > 80) issues.push(`${entry.word}: headword unusually long`);
  if (entry.meaning.length < 12) issues.push(`${entry.word}: meaning unusually short`);
  if (entry.example.length < 25) issues.push(`${entry.word}: example unusually short`);
  if (!Array.isArray(entry.synonyms)) issues.push(`${entry.word}: synonyms is not an array`);
}

for (const group of library.groups) {
  const words = library.words.filter((w) => w.groupKey === group.key);
  const topics = library.topics.filter((t) => t.groupKey === group.key);
  const main = topics.filter((t) => !t.isSupplementary);
  const supp = topics.filter((t) => t.isSupplementary);
  if (words.length !== target[group.key]) issues.push(`${group.key}: expected ${target[group.key]}, got ${words.length}`);
  if (main.length < 12 || main.length > 17) issues.push(`${group.key}: main topic count ${main.length}`);
  if (supp.length < 5 || supp.length > 10) issues.push(`${group.key}: supplementary topic count ${supp.length}`);
  for (const topic of topics) {
    const count = words.filter((w) => w.topicName === topic.name).length;
    if (count < 25) issues.push(`${group.key}/${topic.name}: only ${count} entries`);
  }
}

if (library.words.length !== 2500) issues.push(`expected 2500 entries, got ${library.words.length}`);

if (issues.length) {
  console.error(`Vocabulary audit failed with ${issues.length} issue(s):`);
  console.error(issues.slice(0, 100).join('\n'));
  process.exit(1);
}

console.log(`Vocabulary audit OK: ${library.words.length} unique entries across ${library.topics.length} topics.`);
for (const group of library.groups) {
  const words = library.words.filter((w) => w.groupKey === group.key);
  const lens = words.map((w) => w.word.split(/\s+/).length);
  console.log(`${group.key}: ${words.length} entries; ${lens.filter((n) => n === 1).length} single words; ${lens.filter((n) => n > 1).length} phrases/collocations.`);
}
