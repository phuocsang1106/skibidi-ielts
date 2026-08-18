import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

const sections = [["Users", "/app/admin/users", "Plans, quotas, Pro controls and password resets."], ["Payments", "/app/admin/payments", "Review manual bank-transfer orders."], ["Vocabulary", "/app/admin/vocabulary", "Manage topics and vocabulary entries."], ["Writing Usage", "/app/admin/writing-usage", "Lightweight API-cost and submission usage."], ["User Reports", "/app/admin/reports", "Review learner feedback on Writing results."]] as const;
export default async function AdminPage() { await requireAdmin(); return <div><h1 className="text-2xl font-semibold">Admin</h1><p className="muted mt-2">Functional controls for the MVP.</p><div className="mt-7 grid gap-4 md:grid-cols-2">{sections.map(([name, href, desc]) => <Link key={href} href={href} className="surface p-5 hover:border-gray-300"><h2 className="font-semibold">{name}</h2><p className="muted mt-2 text-sm">{desc}</p></Link>)}</div></div>; }
