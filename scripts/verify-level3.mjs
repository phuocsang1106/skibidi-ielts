import fs from "node:fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const service = fs.readFileSync("src/lib/vocabulary/service.ts", "utf8");
const seed = fs.readFileSync("prisma/seed-level3.ts", "utf8");

const checks = [
  ["Prisma enum contains LEVEL_3", /enum VocabularyLevel[\s\S]*LEVEL_3/.test(schema)],
  ["Vocabulary overview returns level3", service.includes("level3") && service.includes('"LEVEL_3"')],
  ["Level 3 seed targets LEVEL_3", seed.includes('level: "LEVEL_3"')],
  ["Level 3 seed protects cross-level duplicates", seed.includes("existing.level !== \"LEVEL_3\"")],
  ["All 18 topic slugs exist", (seed.match(/\[\"[^\"]+\", \"[^\"]+\", \"(?:CORE|ADDITIONAL)\"\]/g) ?? []).length === 18],
];

for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
if (checks.some(([, ok]) => !ok)) process.exit(1);
