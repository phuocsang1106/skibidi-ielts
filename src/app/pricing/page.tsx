import Link from "next/link";
import { ToiletIcon } from "@/components/toilet-icon";

const free = ["Full Vocabulary · Level 1, 2 and 3", "Pronunciation audio", "Progress tracking", "3 Writing submissions / 30 days", "IELTS Band feedback", "Corrections", "Sentence improvements", "Band 7 sample", "Writing History"];
const pro = ["Full Vocabulary · Level 1, 2 and 3", "10 Writing submissions / 30 days", "Detailed IELTS criterion analysis", "Detailed corrections", "Full essay improvement", "Next-band guidance", "Band 7 sample", "Writing History"];

function Plan({ name, price, items, primary = false }: { name: string; price: string; items: string[]; primary?: boolean }) {
  return (
    <section className="product-card">
      <div style={{ fontSize: 17, fontWeight: 700 }}>{name}</div>
      <div style={{ marginTop: 8, fontSize: 34, fontWeight: 760, letterSpacing: "-.04em" }}>{price}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: "22px 0 0" }}>
        {items.map((item) => <li key={item} style={{ padding: "10px 0", borderTop: "1px solid #eef0f3", fontSize: 13 }}>{item}</li>)}
      </ul>
      <Link href={primary ? "/register" : "/register"} className={primary ? "btn-primary" : "btn-secondary"} style={{ marginTop: 20 }}>{primary ? "Create account" : "Start for free"}</Link>
    </section>
  );
}

export default function PricingPage() {
  return (
    <main>
      <header className="landing-header"><div className="landing-inner"><Link href="/" className="landing-brand"><ToiletIcon className="app-brand-icon" />Skibidi IELTS</Link><nav className="landing-nav"><Link href="/login">Log in</Link></nav></div></header>
      <div className="container-page" style={{ padding: "52px 0 72px" }}>
        <h1 className="page-title">Pricing</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18, maxWidth: 900, marginTop: 26 }} className="pricing-grid">
          <Plan name="Free" price="0đ" items={free} />
          <Plan name="Pro" price="50,000đ / 30 days" items={pro} primary />
        </div>
      </div>
    </main>
  );
}
