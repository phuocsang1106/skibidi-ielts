"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Word = { id: string; word: string; meaning: string | null; example: string | null; translation: string | null; synonyms: string[] };

export function FlashcardDeck({ words, topic }: { words: Word[]; topic: string }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = words[index];

  const previous = useCallback(() => { setIndex((value) => (value - 1 + words.length) % words.length); setFlipped(false); }, [words.length]);
  const next = useCallback(() => { setIndex((value) => (value + 1) % words.length); setFlipped(false); }, [words.length]);
  const flip = useCallback(() => setFlipped((value) => !value), []);

  if (!current) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500"><Badge>{topic}</Badge><span>{index + 1} / {words.length}</span></div>
      <div className="relative h-[420px] [perspective:1200px] sm:h-[460px]">
        <AnimatePresence mode="wait">
          <motion.button
            key={current.id}
            type="button"
            aria-label={flipped ? "Show word" : "Show definition"}
            onClick={flip}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full text-left [transform-style:preserve-3d]"
          >
            <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative h-full w-full rounded-[1.75rem] [transform-style:preserve-3d]">
              <div className="absolute inset-0 flex flex-col justify-between rounded-[1.75rem] border bg-white p-7 shadow-soft [backface-visibility:hidden] sm:p-10"><div className="flex justify-end"><RotateCcw className="h-5 w-5 text-slate-300" /></div><div className="text-center"><p className="text-4xl font-black tracking-tight sm:text-5xl">{current.word}</p><p className="mt-4 text-sm text-slate-400">Tap card to reveal</p></div><p className="text-center text-xs font-medium text-slate-300">SKIBIDI IELTS FLASHCARD</p></div>
              <div className="absolute inset-0 overflow-auto rounded-[1.75rem] bg-slate-950 p-7 text-white shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{current.word}</p><h3 className="mt-5 text-xl font-bold">{current.meaning || "Meaning not added yet."}</h3>{current.translation && <p className="mt-3 text-base font-semibold text-emerald-300">{current.translation}</p>}{current.example && <div className="mt-7 rounded-2xl bg-white/5 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Example</p><p className="mt-2 leading-7 text-slate-200">{current.example}</p></div>}{current.synonyms.length > 0 && <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Synonyms</p><div className="mt-2 flex flex-wrap gap-2">{current.synonyms.map((item) => <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{item}</span>)}</div></div>}</div>
            </motion.div>
          </motion.button>
        </AnimatePresence>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3"><Button variant="outline" size="lg" onClick={previous}><ChevronLeft className="h-4 w-4" />Previous</Button><Button size="lg" onClick={next}>Next<ChevronRight className="h-4 w-4" /></Button></div>
    </div>
  );
}
