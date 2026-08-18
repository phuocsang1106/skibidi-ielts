"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-page flex min-h-screen items-center justify-center py-16">
      <div className="surface max-w-lg p-6">
        <h1 className="text-xl font-semibold">This page could not be loaded</h1>
        <p className="muted mt-2 text-sm">Your data has not been changed. You can retry the page.</p>
        <button className="btn-primary mt-5" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
