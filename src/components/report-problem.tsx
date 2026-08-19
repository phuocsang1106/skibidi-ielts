"use client";

import { useState } from "react";

export function ReportProblem({ submissionId }: { submissionId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setState("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          category: form.get("category"),
          message: form.get("message")
        })
      });
      setState(response.ok ? "Report submitted." : "Could not submit report.");
      if (response.ok) setOpen(false);
    } catch {
      setState("Could not submit report right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button className="btn btn-secondary" type="button" onClick={() => setOpen((value) => !value)}>
        Report a problem
      </button>
      {state ? <span aria-live="polite" className="ml-3 text-sm text-zinc-500">{state}</span> : null}
      {open ? (
        <form onSubmit={submit} className="surface mt-3 max-w-xl p-4">
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" className="input">
            <option value="SCORE_TOO_HIGH">Score seems too high</option>
            <option value="SCORE_TOO_LOW">Score seems too low</option>
            <option value="FEEDBACK_INCORRECT">Feedback incorrect</option>
            <option value="QUESTION_MISUNDERSTOOD">Question misunderstood</option>
            <option value="TASK1_IMAGE_MISUNDERSTOOD">Task 1 image misunderstood</option>
            <option value="OTHER">Other</option>
          </select>
          <label className="label mt-4" htmlFor="message">Optional note</label>
          <textarea className="input" name="message" id="message" rows={3} />
          <button className="btn btn-primary mt-4" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
