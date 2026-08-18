import Link from "next/link";
import { ToiletIcon } from "@/components/toilet-icon";

const free = ["Full Vocabulary · Level 1, 2 and 3", "Pronunciation audio", "Progress tracking", "3 Writing submissions / 30 days", "Band feedback", "Corrections and sentence improvements", "Band 7 sample", "Writing History"];
const pro = ["Full Vocabulary · Level 1, 2 and 3", "10 Writing submissions / 30 days", "Detailed IELTS criterion analysis", "Detailed corrections", "Full essay improvement", "Next-band guidance", "Band 7 sample", "Writing History"];

function Plan({ name, price, items, pro = false }: { name: string; price: React.ReactNode; items: string[]; pro?: boolean }) {
  return <section className="price-v7-card"><div className="price-v7-name">{name}</div><div className="price-v7-amount">{price}</div><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><Link href={pro ? "/app/upgrade" : "/app"} className={pro ? "btn-primary" : "btn-secondary"}>{pro ? "Upgrade to Pro" : "Current plan"}</Link></section>;
}

export default function PricingPage() {
  return <main><header className="landing-header"><div className="landing-inner"><Link href="/" className="landing-brand"><ToiletIcon className="app-brand-icon" />Skibidi IELTS</Link><nav className="landing-nav"><Link href="/login">Log in</Link></nav></div></header><div className="pricing-v7-wrap"><h1 className="page-title">Pricing</h1><div className="pricing-v7-grid"><Plan name="Free" price="0đ" items={free} /><Plan name="Pro" price={<>50,000đ <span>/ 30 days</span></>} items={pro} pro /></div></div></main>;
}
