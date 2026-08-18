import Link from "next/link";
import { ToiletIcon } from "@/components/toilet-icon";

export default function LandingPage() {
  return (
    <main>
      <header className="landing-header">
        <div className="landing-inner">
          <Link href="/" className="landing-brand"><ToiletIcon className="app-brand-icon" /><span>Skibidi IELTS</span></Link>
          <nav className="landing-nav" aria-label="Public navigation">
            <Link href="/pricing">Pricing</Link>
            <Link href="/login">Log in</Link>
          </nav>
        </div>
      </header>
      <section className="landing-hero">
        <h1>Skibidi IELTS</h1>
        <p>For IELTS learners progressing from Band 3.5 to 6.5+</p>
        <Link href="/register" className="btn-primary" style={{ marginTop: 28 }}>Start for free</Link>
      </section>
    </main>
  );
}
