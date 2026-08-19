import { describe, expect, it } from "vitest";
import library from "../../../prisma/vocabulary-library.json";

type Topic = { groupKey: string; isSupplementary: boolean };
type Word = { groupKey: string; word: string; meaning: string; translation: string; example: string };

const expectedCounts: Record<string, number> = { g1: 700, g2: 850, g3: 950 };

describe("IELTS vocabulary library", () => {
  it("contains exactly three band groups and 2,500 unique headwords/phrases", () => {
    expect(library.groups).toHaveLength(3);
    expect(library.words).toHaveLength(2500);
    const normalized = (library.words as Word[]).map((entry) => entry.word.toLowerCase().replace(/\s+/g, " ").trim());
    expect(new Set(normalized).size).toBe(2500);
  });

  it("contains 15 main topics and 7 supplementary topics per group", () => {
    for (const group of library.groups) {
      const topics = (library.topics as Topic[]).filter((topic) => topic.groupKey === group.key);
      expect(topics.filter((topic) => !topic.isSupplementary)).toHaveLength(15);
      expect(topics.filter((topic) => topic.isSupplementary)).toHaveLength(7);
      expect((library.words as Word[]).filter((word) => word.groupKey === group.key)).toHaveLength(expectedCounts[group.key]);
    }
  });

  it("keeps all learner-facing fields populated", () => {
    for (const entry of library.words as Word[]) {
      expect(entry.word.trim().length).toBeGreaterThan(0);
      expect(entry.meaning.trim().length).toBeGreaterThan(0);
      expect(entry.translation.trim().length).toBeGreaterThan(0);
      expect(entry.example.trim().length).toBeGreaterThan(0);
    }
  });
});
