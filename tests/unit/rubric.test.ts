import { describe, expect, it } from "vitest";
import { IELTS_RUBRIC_VERSION, IELTS_WRITING_RUBRIC, rubricText } from "@/lib/ai/rubric";

describe("IELTS May 2023 rubric source", () => {
  it("uses the versioned May 2023 rubric for both Writing tasks", () => {
    expect(IELTS_RUBRIC_VERSION).toBe("IELTS_WRITING_MAY_2023");
    expect(IELTS_WRITING_RUBRIC.task1.criteria).toEqual(["Task Achievement", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range & Accuracy"]);
    expect(IELTS_WRITING_RUBRIC.task2.criteria).toEqual(["Task Response", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range & Accuracy"]);
  });

  it("retains descriptor content needed for strict Task 1 and Task 2 grading", () => {
    expect(rubricText("task1")).toContain("It presents a clear overview");
    expect(rubricText("task2")).toContain("A clear and developed position is presented");
    expect(rubricText("task2")).toContain("Responses of 20 words or fewer are rated at Band 1");
  });
});
