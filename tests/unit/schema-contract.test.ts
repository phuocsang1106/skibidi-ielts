import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");

describe("database architecture contracts", () => {
  it("keeps plan names data-driven instead of a Prisma Plan enum", () => {
    expect(schema).not.toMatch(/enum\s+Plan\s*\{/);
    expect(schema).toMatch(/model\s+Plan\s*\{/);
    expect(schema).toMatch(/aiRequestsPerSubmission\s+Int/);
    expect(schema).toMatch(/features\s+String\[\]/);
  });

  it("has database uniqueness for idempotent Writing and credit consumption", () => {
    expect(schema).toContain("@@unique([userId, idempotencyKey])");
    expect(schema).toMatch(/submissionId\s+String\?\s+@unique/);
  });

  it("has a promo redemption race guard", () => {
    expect(schema).toContain("@@unique([promoCodeId, userId, ordinal])");
  });
});
