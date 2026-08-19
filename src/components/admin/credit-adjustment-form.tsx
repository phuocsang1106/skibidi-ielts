"use client";

import { useState } from "react";
import { grantCreditsAction } from "@/actions/admin";

export function CreditAdjustmentForm({ userId }: { userId: string }) {
  const [amount, setAmount] = useState(5);

  return (
    <form action={grantCreditsAction.bind(null, userId)} className="space-y-4">
      <div>
        <label className="label" htmlFor="credit-amount">Amount</label>
        <input
          id="credit-amount"
          className="input"
          required
          min="1"
          max="100000"
          name="amount"
          type="number"
          value={amount}
          onChange={(event) => setAmount(Math.max(1, Number(event.target.value) || 1))}
        />
      </div>
      <div>
        <div className="mb-2 text-xs text-zinc-500">Quick values</div>
        <div className="flex gap-2">
          {[1, 5, 10].map((value) => (
            <button key={value} type="button" onClick={() => setAmount(value)} className="focus-ring rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-50">
              +{value}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="credit-reason">Reason</label>
        <textarea id="credit-reason" className="input min-h-24" required name="reason" maxLength={500} placeholder="Required for audit history" />
      </div>
      <button className="btn btn-primary w-full">Apply</button>
    </form>
  );
}
