import Link from "next/link";
import { Activity, BadgeDollarSign, BookOpenText, Bot, ClipboardList, CreditCard, FileWarning, LayoutDashboard, ScrollText, Settings, Tags, Users } from "lucide-react";
import { Brand } from "@/components/brand";

const nav = [
  ["Dashboard", "/admin", LayoutDashboard], ["Users", "/admin/users", Users], ["Plans", "/admin/plans", BadgeDollarSign],
  ["Promo Codes", "/admin/promo-codes", Tags], ["Payments", "/admin/payments", CreditCard], ["Writing", "/admin/writing", ClipboardList],
  ["Reports", "/admin/reports", FileWarning], ["Vocabulary", "/admin/vocabulary", BookOpenText], ["AI / Models", "/admin/ai", Bot],
  ["Audit Log", "/admin/audit-log", ScrollText], ["Settings", "/admin/settings", Settings]
] as const;

export function AdminShell({ children, username }: { children: React.ReactNode; username: string }) {
  return <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
    <aside className="hidden min-h-screen border-r border-zinc-200 bg-[#fbfbfa] p-4 md:flex md:flex-col md:sticky md:top-0 md:h-screen">
      <div className="px-2 py-2"><Brand/></div><div className="mt-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Admin</div>
      <nav className="mt-4 space-y-1 overflow-y-auto">{nav.map(([label, href, Icon]) => <Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-100"><Icon size={16}/>{label}</Link>)}</nav>
      <div className="mt-auto border-t border-zinc-200 pt-3"><div className="px-2 text-xs text-zinc-500">Signed in as</div><div className="px-2 text-sm font-medium">{username}</div><Link href="/app/dashboard" className="mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-zinc-100"><Activity size={16}/>Open user app</Link></div>
    </aside>
    <div><header className="border-b border-zinc-200 bg-white px-4 py-3 md:hidden"><div className="flex items-center justify-between"><Brand/><Link href="/app/dashboard" className="text-sm">Exit admin</Link></div><nav className="mt-3 flex gap-1 overflow-x-auto">{nav.map(([label,href])=><Link className="shrink-0 rounded-lg border bg-white px-3 py-2 text-xs" href={href} key={href}>{label}</Link>)}</nav></header><main className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main></div>
  </div>;
}
