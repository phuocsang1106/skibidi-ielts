"use client";

import { useState } from "react";
import type { FinalWritingResult } from "@/lib/ai/schemas";

export function ResultTabs({ result }: { result: FinalWritingResult }) {
  const tabs = ["Overview", "Criteria", "Errors", ...(result.improvedEssay ? ["Improved Essay"] : []), "Band 7 Sample"];
  const [active, setActive] = useState("Overview");
  const taskLabel = result.taskType === "TASK_1" ? "TA" : "TR";
  const taskFull = result.taskType === "TASK_1" ? "Task Achievement" : "Task Response";
  const c = result.criteria;

  return (
    <div className="result-v7">
      <div className="result-tabs-v7" role="tablist">
        {tabs.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={active === tab} onClick={() => setActive(tab)} className={active === tab ? "active" : ""}>{tab}</button>
        ))}
      </div>

      <div className="result-v7-body">
        {active === "Overview" && (
          <div className="result-v7-stack">
            <section className="result-score-card">
              <div className="result-score-main"><span className="result-band-number">{result.estimatedOverallBand.toFixed(1)}</span><span className="result-band-label">Band</span></div>
              <div className="result-criteria-grid">
                {[[taskLabel, c.taskCriterion.band], ["CC", c.coherenceCohesion.band], ["LR", c.lexicalResource.band], ["GRA", c.grammaticalRangeAccuracy.band]].map(([label, band]) => (
                  <div className="result-criterion" key={String(label)}><span>{label}</span><strong>{Number(band).toFixed(1)}</strong></div>
                ))}
              </div>
            </section>
            <section className="result-content-card">
              <h3>Main issue</h3>
              <p>{result.mainIssue}</p>
              <h3>Priority improvements</h3>
              <ol>{result.priorityImprovements.map((item) => <li key={item}>{item}</li>)}</ol>
              {result.nextBandGuidance && <><h3>Next-band guidance</h3><ul>{result.nextBandGuidance.map((item) => <li key={item}>{item}</li>)}</ul></>}
            </section>
          </div>
        )}

        {active === "Criteria" && (
          <div className="result-v7-stack">
            {[[taskFull, c.taskCriterion, result.detailedCriterionAnalysis?.taskCriterion], ["Coherence & Cohesion", c.coherenceCohesion, result.detailedCriterionAnalysis?.coherenceCohesion], ["Lexical Resource", c.lexicalResource, result.detailedCriterionAnalysis?.lexicalResource], ["Grammatical Range & Accuracy", c.grammaticalRangeAccuracy, result.detailedCriterionAnalysis?.grammaticalRangeAccuracy]].map(([name, criterion, detail]) => {
              const x = criterion as typeof c.taskCriterion;
              return (
                <section className="result-content-card" key={String(name)}>
                  <div className="result-section-head"><h3>{String(name)}</h3><strong className="band-red">{x.band.toFixed(1)}</strong></div>
                  <p>{x.summary}</p>
                  {detail && <p className="result-detail-copy">{String(detail)}</p>}
                  <div className="result-two-col"><div><h4>Evidence</h4><ul>{x.evidence.map((e) => <li key={e}>{e}</li>)}</ul></div><div><h4>Key weaknesses</h4><ul>{x.keyWeaknesses.map((e) => <li key={e}>{e}</li>)}</ul></div></div>
                </section>
              );
            })}
          </div>
        )}

        {active === "Errors" && (
          <div className="result-v7-stack">
            {result.errors.length ? result.errors.map((item, index) => (
              <article className="result-content-card" key={`${index}-${item.original}`}>
                <div className="result-error-type">{item.issue}</div>
                <div className="result-error-grid"><div><span>Original</span><p>{item.original}</p></div><div><span>Correction</span><p>{item.correction}</p></div></div>
                <div className="result-explanation"><span>Explanation</span><p>{item.explanation}</p></div>
              </article>
            )) : <div className="result-content-card">No specific errors were returned for this submission.</div>}
            <section className="result-content-card"><h3>Sentence improvements</h3><div className="sentence-list">{result.sentenceImprovements.map((item, index) => <div key={`${index}-${item.original}`}><p><strong>Original:</strong> {item.original}</p><p><strong>Improved:</strong> {item.improved}</p><p className="muted">{item.reason}</p></div>)}</div></section>
          </div>
        )}

        {active === "Improved Essay" && result.improvedEssay && <section className="result-content-card"><h3>Improved version of your essay</h3><div className="result-long-copy">{result.improvedEssay}</div></section>}
        {active === "Band 7 Sample" && <section className="result-content-card"><h3>Band 7 sample answer</h3><div className="result-long-copy">{result.band7Sample}</div></section>}
      </div>
    </div>
  );
}
