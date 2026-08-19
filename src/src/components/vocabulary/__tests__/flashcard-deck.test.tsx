import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlashcardDeck } from "@/components/vocabulary/flashcard-deck";

const words = [
  { id: "w1", word: "sustainable", meaning: "able to continue", example: "Sustainable cities matter.", translation: "bền vững", synonyms: ["viable"] },
  { id: "w2", word: "biodiversity", meaning: "variety of life", example: "Protect biodiversity.", translation: "đa dạng sinh học", synonyms: [] }
];

const speak = vi.fn();
const cancel = vi.fn();

beforeEach(() => {
  speak.mockReset();
  cancel.mockReset();
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      speak,
      cancel,
      getVoices: () => [{ lang: "en-GB", name: "Test British Voice" }]
    }
  });
  vi.stubGlobal("SpeechSynthesisUtterance", class {
    text: string;
    lang = "";
    rate = 1;
    voice: SpeechSynthesisVoice | null = null;
    constructor(text: string) { this.text = text; }
  });
});

describe("FlashcardDeck", () => {
  it("moves to the next vocabulary card", async () => {
    const user = userEvent.setup();
    render(<FlashcardDeck topic="Environment" words={words} />);
    expect(screen.getAllByText("sustainable").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect((await screen.findAllByText("biodiversity")).length).toBeGreaterThan(0);
  });

  it("pronounces every vocabulary word with browser text to speech", async () => {
    const user = userEvent.setup();
    render(<FlashcardDeck topic="Environment" words={words} />);
    await user.click(screen.getAllByRole("button", { name: "Phát âm sustainable" })[0]);
    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
  });
});
