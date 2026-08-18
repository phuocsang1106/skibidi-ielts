import Link from "next/link";

const features = [
  ["Vocabulary for IELTS Reading", "Focused vocabulary for learners progressing toward Band 6.5."],
  ["AI Writing Feedback", "Estimated IELTS Writing bands and practical corrections."],
  ["Track Your Progress", "Simple vocabulary and Writing progress without gamification."]
] as const;

export default function LandingPage() {
  return (
    <main>
      <header className="border-b border-gray-200 bg-white/90">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Skibidi IELTS</Link>
          <nav className="flex items-center gap-5 text-sm" aria-label="Public navigation">
            <a href="#features" className="hidden text-gray-600 hover:text-black sm:block">Features</a>
            <Link href="/pricing" className="hidden text-gray-600 hover:text-black sm:block">Pricing</Link>
            <Link href="/about" className="hidden text-gray-600 hover:text-black md:block">About</Link>
            <Link href="/login" className="font-medium">Log in</Link>
          </nav>
        </div>
      </header>

      <section className="container-page flex min-h-[58vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">Skibidi IELTS</h1>
        <p className="mt-4 text-base text-gray-500 sm:text-lg">For IELTS learners progressing from Band 3.5 to 6.5+</p>
        <Link href="/register" className="btn-primary mt-8">Start for free</Link>
      </section>

      <section id="features" className="container-page border-t border-gray-200 py-14">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map(([title, text]) => (
            <article key={title}>
              <h2 className="font-semibold">{title}</h2>
              <p className="muted mt-2 text-sm leading-6">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-sm text-gray-500">
        <div className="container-page flex flex-wrap justify-between gap-4">
          <span>© Skibidi IELTS</span>
          <div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/pricing">Pricing</Link></div>
        </div>
      </footer>
    </main>
  );
}
