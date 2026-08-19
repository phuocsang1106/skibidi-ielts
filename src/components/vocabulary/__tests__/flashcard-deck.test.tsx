import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FlashcardDeck } from "@/components/vocabulary/flashcard-deck";

const words = [
  { id: "w1", word: "sustainable", meaning: "able to continue", example: "Sustainable cities matter.", translation: "bền vững", synonyms: ["viable"] },
  { id: "w2", word: "biodiversity", meaning: "variety of life", example: "Protect biodiversity.", translation: "đa dạng sinh học", synonyms: [] }
];

describe("FlashcardDeck", () => {
  it("moves to the next vocabulary card", async () => {
    const user = userEvent.setup();
    render(<FlashcardDeck topic="Environment" words={words} />);
    expect(screen.getAllByText("sustainable").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect((await screen.findAllByText("biodiversity")).length).toBeGreaterThan(0);
  });
});
