import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const landing = read("src/app/page.tsx");
check("landing hero title", landing.includes("Skibidi IELTS"));
check("landing target subtitle", landing.includes("For IELTS learners progressing from Band 3.5 to 6.5+"));
check("no Sign Up header copy", !landing.includes("Sign Up"));
check("no View Pricing hero CTA", !landing.includes("View Pricing"));

const schema = read("prisma/schema.prisma");
for (const model of ["User", "Session", "VocabularyTopic", "VocabularyItem", "VocabularyProgress", "WritingSubmission", "EntitlementPeriod", "PaymentOrder", "UserReport", "AppSetting"]) {
  check(`Prisma model ${model}`, schema.includes(`model ${model} {`));
}
check("normalized vocabulary lemma is globally unique", /normalizedWord\s+String\s+@unique/.test(schema));

const uploads = read("src/lib/files/uploads.ts");
check("5 MB per-file limit", uploads.includes("5 * 1024 * 1024"));
check("question extensions", uploads.includes('"jpg", "jpeg", "png", "webp", "pdf"'));
check("Writing DOCX support", uploads.includes('"docx"'));
check("no filesystem persistence in upload service", !/(writeFile|createWriteStream|mkdirSync|writeFileSync)/.test(uploads));

const grading = read("src/lib/ai/gemini.ts");
check("structured JSON response format", grading.includes('mimeType: "application/json"'));
check("verification grading pass", grading.includes("verification pass"));
check("Task 1 no-invention prompt", grading.includes("Never invent"));

const entitlements = read("src/lib/entitlements/service.ts");
check("advisory quota lock", entitlements.includes("pg_advisory_xact_lock"));
check("reservation before quota consumption", entitlements.includes("WritingReservation") || entitlements.includes("writingReservation"));
check("successful quota increment", entitlements.includes("quotaUsed: { increment: 1 }"));

const payments = read("src/lib/payments/service.ts");
check("manual payment awaiting state", payments.includes("AWAITING_VERIFICATION"));
check("paid order cannot be rejected", payments.includes("Paid orders cannot be rejected"));
check("early Pro renewal appends after latest expiry", payments.includes("latestPro?.endAt ?? now"));

const seed = read("prisma/seed.ts");
const seededWords = [...seed.matchAll(/\be\("([^"]+)"/g)].map((match) => match[1].normalize("NFKC").trim().toLowerCase());
check("seed vocabulary has no duplicate lemmas", new Set(seededWords).size === seededWords.length);
const topicHeader = seed.split("] as const;")[0];
const topicCount = [...topicHeader.matchAll(/\["[^"]+", "[^"]+", "(?:CORE|ADDITIONAL)"\]/g)].length;
check("18 topic definitions (12 core + 6 additional)", topicCount === 18);

const failures = checks.filter((item) => !item.ok);
for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name}`);
console.log(`\n${checks.length - failures.length}/${checks.length} static checks passed.`);
if (failures.length) process.exit(1);
