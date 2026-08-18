import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "@/components/progress-bar";

describe("ProgressBar", () => {
  it("exposes progress semantics for assistive technology", () => {
    render(<ProgressBar value={31} max={64} />);
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "31");
    expect(progress).toHaveAttribute("aria-valuemax", "64");
  });
});
