import Link from "next/link";
import { BookOpenText, Gauge, History, PenLine } from "lucide-react";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";

const nav = [
  ["Dashboard", "/app/dashboard", Gauge],
  ["Vocabulary", "/app/vocabulary", BookOpenText],
  ["Writing", "/app/writing", PenLine],
  ["History", "/app/history", History]
] as const;

export function AppShell({ username, children }: { username: string; children: React.ReactNode }) {
  return <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
    <aside className="hidden min-h-screen border-r border-zinc-200 bg-[#fbfbfa] p-4 md:flex md:flex-col md:sticky md:top-0 md:h-screen">
      <div className="px-2 py-2"><Brand/></div>
      <nav className="mt-5 space-y-1">
        {nav.map(([label, href, Icon]) => <Link key={href} href={href} className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"><Icon size={17}/>{label}</Link>)}
      </nav>
      <div className="mt-auto"><UserMenu username={username}/></div>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#f7f7f5]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3"><Brand/><div className="w-44 max-w-[48vw]"><UserMenu username={username} placement="down"/></div></div>
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">{nav.map(([label, href, Icon]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium shadow-sm ring-1 ring-zinc-200"><Icon size={14}/>{label}</Link>)}</nav>
      </header>
      <main className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  </div>;
}
