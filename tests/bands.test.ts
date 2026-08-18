import { describe, expect, it } from "vitest";
import { overallBand, roundBand } from "@/lib/writing/bands";

describe("IELTS task band calculation", () => {
  it("rounds to the nearest half band and clamps the IELTS range", () => {
    expect(roundBand(5.24)).toBe(5);
    expect(roundBand(5.26)).toBe(5.5);
    expect(roundBand(9.4)).toBe(9);
    expect(roundBand(-1)).toBe(0);
  });

  it("derives one estimated task band from four independently scored criteria", () => {
    expect(overallBand([5.5, 6, 5.5, 5])).toBe(5.5);
    expect(overallBand([6, 6.5, 6, 5.5])).toBe(6);
  });

  it("rejects incomplete criterion sets", () => {
    expect(() => overallBand([6, 6, 6])).toThrow(/exactly four/i);
  });
});
