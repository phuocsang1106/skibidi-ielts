"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setVocabularyLearnedAction } from "@/lib/vocabulary/actions";

export type FlashcardItem = {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  vietnameseMeaning: string;
  readingDefinition: string;
  exampleSentence: string;
  wordFamily: string[];
  collocations: string[];
  learned: boolean;
};

function SpeakerButton({ word }: { word: string }) {
  function speak(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => item.lang.toLowerCase() === "en-gb") ?? voices.find((item) => item.lang.toLowerCase().startsWith("en-gb"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button type="button" className="flash-speaker" onClick={speak} aria-label={`Play British pronunciation for ${word}`}>
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M11 5 6.8 8.5H4v7h2.8L11 19V5Z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.8 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>
    </button>
  );
}

export function VocabularyFlashcards({ items }: { items: FlashcardItem[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const safeIndex = useMemo(() => items.length ? Math.min(index, items.length - 1) : 0, [index, items.length]);
  const current = items[safeIndex];

  if (!current) {
    return <div className="product-card" style={{ marginTop: 24 }}><strong>No vocabulary matches this filter.</strong></div>;
  }

  function move(direction: -1 | 1) {
    setFlipped(false);
    setIndex((value) => (value + direction + items.length) % items.length);
  }

  function toggleLearned() {
    const formData = new FormData();
    formData.set("vocabularyItemId", current.id);
    formData.set("learned", current.learned ? "false" : "true");
    startTransition(async () => {
      await setVocabularyLearnedAction(formData);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flashcard-stage">
        <button type="button" className="flash-arrow" onClick={() => move(-1)} aria-label="Previous vocabulary card">‹</button>
        <div className="flash-perspective">
          <div
            className={`flashcard${flipped ? " flipped" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`Flip card for ${current.word}`}
            onClick={() => setFlipped((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setFlipped((value) => !value);
              }
            }}
          >
            <div className="flash-face flash-front">
              <div className="flash-word-row"><span className="flash-word">{current.word}</span><SpeakerButton word={current.word} /></div>
              <div className="flash-ipa">{current.ipa} · {current.partOfSpeech}</div>
            </div>
            <div className="flash-face flash-back">
              <h2 className="flash-meaning">{current.vietnameseMeaning}</h2>
              <div className="flash-detail"><span className="flash-label">Reading definition</span>{current.readingDefinition}</div>
              <div className="flash-detail"><span className="flash-label">Example</span>{current.exampleSentence}</div>
              <div className="flash-detail"><span className="flash-label">Word family</span>{current.wordFamily.join(", ") || "—"}</div>
              <div className="flash-detail"><span className="flash-label">Collocations</span>{current.collocations.join(" · ") || "—"}</div>
            </div>
          </div>
        </div>
        <button type="button" className="flash-arrow" onClick={() => move(1)} aria-label="Next vocabulary card">›</button>
      </div>
      <div className="flash-actions">
        <span className="flash-counter">{safeIndex + 1} / {items.length}</span>
        <button type="button" className={current.learned ? "btn-primary" : "btn-secondary"} onClick={toggleLearned} disabled={pending}>
          {pending ? "Saving…" : current.learned ? "Learned ✓" : "Mark as learned"}
        </button>
      </div>
    </>
  );
}
