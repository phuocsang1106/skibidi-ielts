import fs from "node:fs";
const pipeline = fs.readFileSync("src/lib/ai/openrouter-three-stage.ts", "utf8");
const rubric = fs.readFileSync("src/lib/ai/ielts-rubric-2023.ts", "utf8");
const client = fs.readFileSync("src/lib/ai/openrouter-client.ts", "utf8");
const checks = [
  ["OpenRouter chat completions endpoint", client.includes("/chat/completions")],
  ["JSON schema structured outputs", client.includes('type: "json_schema"')],
  ["Gemini 3.7 Flash default", client.includes("google/gemini-3.7-flash")],
  ["Task 1 Task Achievement rubric", rubric.includes("TASK 1 ACADEMIC — TASK ACHIEVEMENT")],
  ["Task 2 Task Response rubric", rubric.includes("TASK 2 — TASK RESPONSE")],
  ["Coherence and Cohesion rubric", rubric.includes("COHERENCE & COHESION")],
  ["Lexical Resource rubric", rubric.includes("LEXICAL RESOURCE")],
  ["Grammar rubric", rubric.includes("GRAMMATICAL RANGE & ACCURACY")],
  ["Task 2 examiner/verifier/feedback stages", pipeline.includes("REQUEST 2 = verifier") && pipeline.includes("REQUEST 3 = feedback")],
  ["Task 1 three-stage combined verifier feedback", pipeline.includes("TASK 1 REQUEST 3 = verifier + feedback")],
  ["Task 1 no-invention instruction", pipeline.includes("Never invent Task 1 numbers")],
  ["Free/Pro feedback split", pipeline.includes('input.plan === "FREE"')],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
