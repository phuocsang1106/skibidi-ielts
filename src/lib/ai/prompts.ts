import type { ExaminerOutput, FeedbackOutput, Task1Extraction, TeachingAnalysis } from "@/lib/ai/schemas";

export const COMMON_EXAMINER_RULES = `
You are an IELTS Writing examiner. Grade strictly against the supplied official May 2023 IELTS Writing Band Descriptors.
Rules:
- Score each criterion independently from actual evidence in the response.
- Never choose an overall score first and force criteria to match it.
- Do not inflate scores to encourage the learner.
- Do not penalize minor errors disproportionately.
- Sophisticated vocabulary earns credit only when accurate, appropriate and naturally controlled.
- Treat copied prompt/rubric language as non-evidence.
- Be evidence-based and concise.
- Criterion bands may use 0.5 increments when the performance lies between descriptor levels.
`;

export const TASK1_EXAMINER_RULES = `${COMMON_EXAMINER_RULES}
Task 1 additionally requires you to assess the overview, key features, main trends/differences, appropriate data selection, factual accuracy, and whether claims are supported by the visual/question evidence. Never invent a number that is not confidently visible in the source.
`;

export const TASK2_EXAMINER_RULES = `${COMMON_EXAMINER_RULES}
Task 2 additionally requires you to assess whether the prompt is actually answered, whether the position is clear and developed, and whether ideas are sufficiently extended and supported.
`;

export function feedbackRules(features: readonly string[]) {
  const enabled = new Set(features);
  return `
Generate teaching feedback from the locked criterion scores and evidence. You are NOT allowed to modify, restate alternatives to, or challenge the locked bands.
Return only the requested feedback fields.
Feature entitlements:
- ERROR_ANALYSIS: ${enabled.has("ERROR_ANALYSIS")}
- SENTENCE_IMPROVEMENTS: ${enabled.has("SENTENCE_IMPROVEMENTS")}
- PRIORITY_IMPROVEMENTS: ${enabled.has("PRIORITY_IMPROVEMENTS")}
- BAND7_SAMPLE: ${enabled.has("BAND7_SAMPLE")}
- IMPROVED_ESSAY: ${enabled.has("IMPROVED_ESSAY")}
- DETAILED_CRITERION_ANALYSIS: ${enabled.has("DETAILED_CRITERION_ANALYSIS")}
- NEXT_BAND_GUIDANCE: ${enabled.has("NEXT_BAND_GUIDANCE")}
For disabled optional features, return an empty array or null as appropriate. The Band 7 sample must answer the exact prompt and realistically resemble approximately Band 7 quality rather than polished Band 9 prose. An improved essay should preserve the learner's ideas where possible.
`;
}

export function lockedScoresText(examiner: ExaminerOutput) {
  const c = examiner.criteria;
  return JSON.stringify({
    taskCriterion: { name: c.taskCriterion.name, band: c.taskCriterion.band, summary: c.taskCriterion.summary, evidence: c.taskCriterion.evidence, limitingWeaknesses: c.taskCriterion.limitingWeaknesses },
    coherenceCohesion: { name: c.coherenceCohesion.name, band: c.coherenceCohesion.band, summary: c.coherenceCohesion.summary, evidence: c.coherenceCohesion.evidence, limitingWeaknesses: c.coherenceCohesion.limitingWeaknesses },
    lexicalResource: { name: c.lexicalResource.name, band: c.lexicalResource.band, summary: c.lexicalResource.summary, evidence: c.lexicalResource.evidence, limitingWeaknesses: c.lexicalResource.limitingWeaknesses },
    grammaticalRangeAccuracy: { name: c.grammaticalRangeAccuracy.name, band: c.grammaticalRangeAccuracy.band, summary: c.grammaticalRangeAccuracy.summary, evidence: c.grammaticalRangeAccuracy.evidence, limitingWeaknesses: c.grammaticalRangeAccuracy.limitingWeaknesses }
  });
}

export function extractionText(extraction: Task1Extraction) {
  return JSON.stringify(extraction);
}

export function teachingText(teaching: TeachingAnalysis | null) {
  return teaching ? JSON.stringify(teaching) : "No separate teaching-analysis stage was used.";
}

export function blankFeedback(): FeedbackOutput {
  return { mainIssue: "", errors: [], sentenceImprovements: [], priorityImprovements: [], band7Sample: "", improvedEssay: null, detailedCriterionAnalysis: null, nextBandGuidance: null };
}
