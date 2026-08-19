import { describe, expect, it } from "vitest";
import { registerSchema, validateUpload } from "@/lib/validation";

describe("registration validation", () => {
  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ username: "learner_01", password: "password123", confirmPassword: "different123" });
    expect(result.success).toBe(false);
  });
});

describe("upload validation", () => {
  it("rejects unsupported file types", () => {
    const file = new File(["hello"], "essay.txt", { type: "text/plain" });
    expect(validateUpload(file)).toMatch(/Only JPG/);
  });
});
