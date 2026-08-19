"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, ChevronUp, Clock3, CreditCard, LogOut, Menu, PenLine, Settings2, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/logo";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/dashboard/writing", label: "Writing AI", icon: PenLine },
  { href: "/dashboard/history", label: "History", icon: Clock3 },
  { href: "/dashboard/pricing", label: "Pricing", icon: CreditCard }
];

export function DashboardSidebar({ username, planName }: { username: string; planName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-5">
        <Logo href="/dashboard" />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Dashboard navigation">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><item.icon className="h-4 w-4" />{item.label}</Link>;
        })}
      </nav>
      <div className="relative border-t p-3">
        {profileOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 overflow-hidden rounded-2xl border bg-white p-1.5 shadow-xl">
            <Link href="/dashboard/account" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"><Settings2 className="h-4 w-4" />Account</Link>
            <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"><LogOut className="h-4 w-4" />Logout</button>
          </div>
        )}
        <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-slate-100" aria-expanded={profileOpen}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm"><UserRound className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{username}</span><span className="mt-0.5 block text-xs text-slate-500">{planName}</span></span>
          <ChevronUp className={cn("h-4 w-4 text-slate-400 transition", profileOpen ? "rotate-0" : "rotate-180")} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">{nav}</aside>
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur lg:hidden"><Logo compact href="/dashboard" /><Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button></div>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} aria-label="Close navigation overlay" /><aside className="absolute inset-y-0 left-0 w-[min(86vw,320px)] bg-white shadow-2xl">{nav}</aside></div>}
    </>
  );
}
