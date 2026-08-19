"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md rounded-3xl border bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">We could not load this page.</h1>
        <p className="mt-3 text-sm text-slate-600">Please retry. If the issue continues, check server logs and environment configuration.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
