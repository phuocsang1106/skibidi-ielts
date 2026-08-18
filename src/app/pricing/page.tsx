import Link from "next/link";

const free = ["Full Vocabulary", "Pronunciation audio", "Progress tracking", "3 Writing evaluations / 30 days", "Estimated IELTS Band", "Corrections", "Sentence improvements", "Band 7 sample", "Writing History"];
const pro = ["Full Vocabulary", "10 Writing evaluations / 30 days", "Detailed IELTS criterion analysis", "Detailed corrections", "Full essay improvement", "Next-band guidance", "Band 7 sample", "Writing History"];

function Plan({ name, price, items, cta }: { name: string; price: string; items: string[]; cta: React.ReactNode }) {
  return <section className="surface p-6"><h2 className="text-xl font-semibold">{name}</h2><div className="mt-2 text-3xl font-semibold">{price}</div><ul className="mt-6 space-y-3 text-sm">{items.map(i => <li key={i} className="border-t border-gray-100 pt-3">{i}</li>)}</ul><div className="mt-7">{cta}</div></section>;
}

export default function PricingPage() {
  return <main className="container-page py-14"><Link href="/" className="text-sm text-gray-500">← Skibidi IELTS</Link><h1 className="mt-8 text-3xl font-semibold tracking-tight">Pricing</h1><p className="muted mt-2">Two plans. Vocabulary is fully available on both.</p><div className="mt-8 grid max-w-4xl gap-6 md:grid-cols-2"><Plan name="Free" price="0đ" items={free} cta={<Link className="btn-secondary" href="/register">Start for free</Link>} /><Plan name="Pro" price="50,000đ / 30 days" items={pro} cta={<Link className="btn-primary" href="/register">Create account</Link>} /></div></main>;
}
