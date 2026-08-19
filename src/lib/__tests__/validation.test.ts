import { describe, expect, it } from "vitest";
import { registerSchema, validateUpload, writingEssaySchema, writingPromptSchema } from "@/lib/validation";

describe("registration validation", () => {
  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ username: "learner_01", password: "password123", confirmPassword: "different123" });
    expect(result.success).toBe(false);
  });
});

describe("writing validation", () => {
  it("requires a meaningful essay body", () => {
    expect(writingEssaySchema.safeParse("too short").success).toBe(false);
    expect(writingEssaySchema.safeParse("This is a sufficiently long IELTS response that contains enough text for the grader to assess.").success).toBe(true);
  });

  it("accepts an empty text prompt when the task is supplied as a file", () => {
    expect(writingPromptSchema.safeParse("").success).toBe(true);
  });
});

describe("upload validation", () => {
  it("rejects unsupported file types", () => {
    const file = new File(["hello"], "essay.txt", { type: "text/plain" });
    expect(validateUpload(file)).toMatch(/Only JPG/);
  });
});
