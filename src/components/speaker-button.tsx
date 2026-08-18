"use client";

export function SpeakerButton({ word }: { word: string }) {
  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    const voices = window.speechSynthesis.getVoices();
    const british = voices.find((voice) => voice.lang.toLowerCase() === "en-gb") || voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb"));
    if (british) utterance.voice = british;
    window.speechSynthesis.speak(utterance);
  }
  return <button type="button" onClick={speak} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-sm hover:bg-gray-50" aria-label={`Play British pronunciation for ${word}`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5 6.8 8.5H4v7h2.8L11 19V5Z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.8 6.8a7.5 7.5 0 0 1 0 10.4"/></svg></button>;
}
