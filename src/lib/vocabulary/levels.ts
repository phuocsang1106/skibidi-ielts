export const VOCABULARY_LEVELS = ["LEVEL_1", "LEVEL_2", "LEVEL_3"] as const;

export type VocabularyLevelValue = (typeof VOCABULARY_LEVELS)[number];

export const VOCABULARY_LEVEL_META: Record<
  VocabularyLevelValue,
  { slug: string; label: string; range: string; coverage: string }
> = {
  LEVEL_1: {
    slug: "level-1",
    label: "Level 1",
    range: "IELTS 3.5 → 5.0",
    coverage: "Vocabulary coverage approximately to Band 5.5.",
  },
  LEVEL_2: {
    slug: "level-2",
    label: "Level 2",
    range: "IELTS 5.0 → 6.5",
    coverage: "Vocabulary coverage approximately to Band 7.0.",
  },
  LEVEL_3: {
    slug: "level-3",
    label: "Level 3",
    range: "IELTS 6.5+",
    coverage: "Advanced academic vocabulary for Reading beyond Band 6.5.",
  },
};

export function vocabularyLevelFromSlug(slug: string): VocabularyLevelValue | null {
  if (slug === "level-1") return "LEVEL_1";
  if (slug === "level-2") return "LEVEL_2";
  if (slug === "level-3") return "LEVEL_3";
  return null;
}

export function vocabularyLevelLabel(level: VocabularyLevelValue) {
  return VOCABULARY_LEVEL_META[level].label;
}
