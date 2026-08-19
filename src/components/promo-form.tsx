"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PromoResponse = {
  message?: string;
  result?: {
    type: "ADD_SUBMISSIONS" | "GRANT_PLAN";
    amount?: number;
    planName?: string;
    queued?: boolean;
  };
};

export function PromoForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.get("code") })
      });
      const data = await response.json() as PromoResponse;
      if (!response.ok || !data.result) {
        setMessage(data.message || "Promo code could not be applied.");
        return;
      }
      if (data.result.type === "ADD_SUBMISSIONS") {
        setMessage(`Applied: +${data.result.amount ?? 0} submissions.`);
      } else {
        setMessage(`Applied: ${data.result.planName || "plan"}${data.result.queued ? " (queued after your current paid plan)" : ""}.`);
      }
      router.refresh();
    } catch {
      setMessage("Promo code could not be applied right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface p-5">
      <div className="font-semibold">Have a promo code?</div>
      <div className="mt-3 flex gap-2">
        <input className="input" name="code" placeholder="CODE" autoCapitalize="characters" autoComplete="off" required />
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Applying…" : "Apply"}</button>
      </div>
      {message ? <p aria-live="polite" className="mt-2 text-sm text-zinc-600">{message}</p> : null}
    </form>
  );
}
