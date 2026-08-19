export const PLAN_FEATURES = {
  BAND_SCORE: { label: "Band score", description: "Overall IELTS Writing band score" },
  CRITERIA_BREAKDOWN: { label: "Criteria breakdown", description: "Band and feedback for all four IELTS criteria" },
  ERROR_ANALYSIS: { label: "Error analysis", description: "Specific language and task errors" },
  SENTENCE_IMPROVEMENTS: { label: "Sentence improvements", description: "Targeted sentence-level rewrites" },
  PRIORITY_IMPROVEMENTS: { label: "Priority improvements", description: "Highest-impact actions for the next attempt" },
  BAND7_SAMPLE: { label: "Band 7 sample", description: "A realistic Band 7 sample answer" },
  DETAILED_CRITERION_ANALYSIS: { label: "Detailed criterion analysis", description: "Deeper evidence mapped to the IELTS descriptors" },
  IMPROVED_ESSAY: { label: "Improved essay", description: "Improved answer preserving the learner's ideas" },
  NEXT_BAND_GUIDANCE: { label: "Next-band guidance", description: "Concrete guidance for reaching the next band" },
  VOCAB_LEVEL_1: { label: "Vocabulary Level 1", description: "IELTS 3.5 to 5.0 vocabulary" },
  VOCAB_LEVEL_2: { label: "Vocabulary Level 2", description: "IELTS 5.0 to 6.5 vocabulary" },
  VOCAB_LEVEL_3: { label: "Vocabulary Level 3", description: "IELTS 6.5+ vocabulary" }
} as const;

export type PlanFeatureKey = keyof typeof PLAN_FEATURES;

export function hasFeature(features: readonly string[], key: PlanFeatureKey) {
  return features.includes(key);
}

export function isKnownFeature(value: string): value is PlanFeatureKey {
  return value in PLAN_FEATURES;
}

export function featureLabel(value: string) {
  return isKnownFeature(value) ? PLAN_FEATURES[value].label : value.replaceAll("_", " ").toLowerCase();
}
