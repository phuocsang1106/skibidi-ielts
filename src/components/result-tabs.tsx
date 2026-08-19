"use client";

import { useState } from "react";

type Criterion = { key: string; name: string; band: string; summary: string; evidence: unknown; limitingWeaknesses: unknown };
type ErrorItem = { original?: string; issue?: string; correction?: string; explanation?: string };
type SentenceImprovement = { original?: string; improved?: string; why?: string };
type Props = {
  overallBand: string;
  mainIssue: string;
  criteria: Criterion[];
  errors: ErrorItem[];
  sentenceImprovements: SentenceImprovement[];
  priorityImprovements: string[];
  band7Sample: string;
  improvedEssay: string | null;
  detailedCriterionAnalysis: Record<string, string> | null;
  nextBandGuidance: string[];
  features: string[];
};

export function ResultTabs(props: Props) {
  const tabs = [
    "Overview",
    ...(props.features.includes("CRITERIA_BREAKDOWN") ? ["Criteria"] : []),
    ...(props.features.includes("ERROR_ANALYSIS") || props.features.includes("SENTENCE_IMPROVEMENTS") ? ["Errors"] : []),
    ...(props.features.includes("IMPROVED_ESSAY") && props.improvedEssay ? ["Improved Essay"] : []),
    ...(props.features.includes("BAND7_SAMPLE") && props.band7Sample ? ["Band 7 Sample"] : [])
  ];
  const [active, setActive] = useState(tabs[0] || "Overview");

  return (
    <div>
      <div role="tablist" aria-label="Writing result sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={active === tab}
            key={tab}
            onClick={() => setActive(tab)}
            className={`focus-ring shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${active === tab ? "border-zinc-900 text-zinc-950" : "border-transparent text-zinc-500"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="surface p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Band</div>
            <div className="mt-2 text-5xl font-semibold text-red-600">{props.features.includes("BAND_SCORE") ? props.overallBand : "—"}</div>
          </div>
          <div className="space-y-4">
            <div className="surface p-5">
              <h2 className="font-semibold">Main issue</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{props.mainIssue}</p>
            </div>
            {props.features.includes("CRITERIA_BREAKDOWN") ? (
              <div className="surface p-5">
                <h2 className="font-semibold">Criterion overview</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {props.criteria.map((criterion) => (
                    <div key={criterion.key} className="rounded-xl border border-zinc-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{criterion.name}</span>
                        <span className="font-semibold text-red-600">{criterion.band}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{criterion.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {props.features.includes("PRIORITY_IMPROVEMENTS") ? (
              <div className="surface p-5">
                <h2 className="font-semibold">Priority improvements</h2>
                <ol className="mt-3 space-y-2 text-sm text-zinc-600">{props.priorityImprovements.map((item, index) => <li key={index}>{index + 1}. {item}</li>)}</ol>
              </div>
            ) : null}
            {props.features.includes("NEXT_BAND_GUIDANCE") && props.nextBandGuidance.length ? (
              <div className="surface p-5">
                <h2 className="font-semibold">Next-band guidance</h2>
                <ul className="mt-3 space-y-2 text-sm text-zinc-600">{props.nextBandGuidance.map((item, index) => <li key={index}>• {item}</li>)}</ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {active === "Criteria" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {props.criteria.map((criterion) => (
              <article className="surface p-5" key={criterion.key}>
                <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{criterion.name}</h2><div className="text-lg font-semibold text-red-600">{criterion.band}</div></div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{criterion.summary}</p>
                {Array.isArray(criterion.evidence) && criterion.evidence.length > 0 ? (
                  <div className="mt-4"><div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Evidence</div><ul className="mt-2 space-y-1 text-sm text-zinc-600">{criterion.evidence.map((evidence, index) => <li key={index}>• {String(evidence)}</li>)}</ul></div>
                ) : null}
                {Array.isArray(criterion.limitingWeaknesses) && criterion.limitingWeaknesses.length > 0 ? (
                  <div className="mt-4"><div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Limiting weaknesses</div><ul className="mt-2 space-y-1 text-sm text-zinc-600">{criterion.limitingWeaknesses.map((weakness, index) => <li key={index}>• {String(weakness)}</li>)}</ul></div>
                ) : null}
              </article>
            ))}
          </div>
          {props.features.includes("DETAILED_CRITERION_ANALYSIS") && props.detailedCriterionAnalysis ? (
            <article className="surface p-5">
              <h2 className="font-semibold">Detailed criterion analysis</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries(props.detailedCriterionAnalysis).map(([key, value]) => <div key={key}><div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{key.replaceAll("_", " ")}</div><p className="mt-1 text-sm leading-6 text-zinc-600">{value}</p></div>)}</div>
            </article>
          ) : null}
        </div>
      ) : null}

      {active === "Errors" ? (
        <div className="space-y-4">
          {props.features.includes("ERROR_ANALYSIS") ? (
            <div className="space-y-3">
              {props.errors.length ? props.errors.map((error, index) => (
                <article className="surface p-5" key={index}>
                  <div className="text-sm font-medium text-zinc-900">{error.original || "—"}</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div><div className="text-xs font-semibold text-zinc-400">Issue</div><p className="mt-1 text-sm text-zinc-600">{error.issue}</p></div>
                    <div><div className="text-xs font-semibold text-zinc-400">Correction</div><p className="mt-1 text-sm text-zinc-600">{error.correction}</p></div>
                    <div><div className="text-xs font-semibold text-zinc-400">Why</div><p className="mt-1 text-sm text-zinc-600">{error.explanation}</p></div>
                  </div>
                </article>
              )) : <div className="surface p-6 text-sm text-zinc-500">No major errors were returned for this submission.</div>}
            </div>
          ) : null}
          {props.features.includes("SENTENCE_IMPROVEMENTS") && props.sentenceImprovements.length ? (
            <article className="surface p-5">
              <h2 className="font-semibold">Sentence improvements</h2>
              <div className="mt-4 space-y-4">{props.sentenceImprovements.map((item, index) => <div key={index} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0"><p className="text-sm text-zinc-500 line-through">{item.original}</p><p className="mt-1 text-sm font-medium text-zinc-900">{item.improved}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{item.why}</p></div>)}</div>
            </article>
          ) : null}
        </div>
      ) : null}

      {active === "Improved Essay" ? <article className="surface whitespace-pre-wrap p-6 text-sm leading-7 text-zinc-700">{props.improvedEssay}</article> : null}
      {active === "Band 7 Sample" ? <article className="surface whitespace-pre-wrap p-6 text-sm leading-7 text-zinc-700">{props.band7Sample}</article> : null}
    </div>
  );
}
