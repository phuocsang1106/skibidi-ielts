"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Volume2 } from "lucide-react";

type ProgressStatus = "NOT_STARTED" | "LEARNING" | "LEARNED";
type Word = {
  id: string;
  word: string;
  ipa: string | null;
  partOfSpeech: string;
  vietnameseMeaning: string;
  collocations: string[];
  synonyms: string[];
  exampleSentence: string;
  usageNote: string | null;
  progress: { status: ProgressStatus }[];
};

export function Flashcards({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ProgressStatus>>(() =>
    Object.fromEntries(words.map((word) => [word.id, word.progress[0]?.status || "NOT_STARTED"]))
  );

  const candidate = words[index];
  if (!candidate) return <div className="surface p-8 text-center text-zinc-500">No words in this topic yet.</div>;
  const word: Word = candidate;

  async function updateProgress(status: ProgressStatus) {
    await fetch("/api/vocabulary/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, status })
    });
  }

  function flip() {
    setFlipped((value) => !value);
    if (statuses[word.id] === "NOT_STARTED") {
      setStatuses((current) => ({ ...current, [word.id]: "LEARNING" }));
      void updateProgress("LEARNING");
    }
  }

  function markLearned() {
    setStatuses((current) => ({ ...current, [word.id]: "LEARNED" }));
    void updateProgress("LEARNED");
  }

  function go(delta: number) {
    setIndex((index + delta + words.length) % words.length);
    setFlipped(false);
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-GB";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
        <span>{index + 1} / {words.length}</span>
        <span>{Object.values(statuses).filter((value) => value === "LEARNED").length} learned</span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`Flip flashcard for ${word.word}`}
        onClick={flip}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            flip();
          }
        }}
        className="focus-ring block w-full cursor-pointer text-left [perspective:1200px]"
      >
        <div className={`relative min-h-[430px] w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
          <div className="surface absolute inset-0 grid place-items-center p-8 [backface-visibility:hidden]">
            <div className="text-center">
              <div className="text-4xl font-semibold tracking-tight sm:text-5xl">{word.word}</div>
              {word.ipa ? <div className="mt-3 text-lg text-zinc-500">{word.ipa}</div> : null}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  speak();
                }}
                onKeyDown={(event) => event.stopPropagation()}
                className="focus-ring mx-auto mt-5 grid size-10 place-items-center rounded-full border border-zinc-200 bg-white"
                aria-label={`Pronounce ${word.word}`}
              >
                <Volume2 size={17} />
              </button>
            </div>
          </div>

          <div className="surface absolute inset-0 overflow-hidden p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8">
            <div className="mx-auto flex h-full max-w-2xl flex-col justify-center">
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-semibold">{word.vietnameseMeaning}</h2>
                <span className="text-sm italic text-zinc-500">{word.partOfSpeech}</span>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Collocations</div>
                  <p className="mt-2 text-sm leading-6">{word.collocations.join(" · ") || "—"}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Synonyms</div>
                  <p className="mt-2 text-sm leading-6">{word.synonyms.join(" · ") || "—"}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Example</div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{word.exampleSentence}</p>
              </div>
              {word.usageNote ? (
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Note</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">{word.usageNote}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <button className="btn btn-secondary" type="button" onClick={() => go(-1)}><ChevronLeft size={16} />Previous</button>
        <button type="button" className="btn btn-secondary" onClick={() => setFlipped(false)}><RotateCcw size={15} />Reset</button>
        <button type="button" onClick={markLearned} className={`btn ${statuses[word.id] === "LEARNED" ? "btn-secondary" : "btn-primary"}`}><Check size={16} />{statuses[word.id] === "LEARNED" ? "Learned" : "Mark learned"}</button>
        <button className="btn btn-secondary" type="button" onClick={() => go(1)}>Next<ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
