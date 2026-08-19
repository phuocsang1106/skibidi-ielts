"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, Clock3, CreditCard, LogOut, Menu, PenLine, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/logo";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/dashboard/writing", label: "Writing AI", icon: PenLine },
  { href: "/dashboard/history", label: "History", icon: Clock3 },
  { href: "/dashboard/pricing", label: "Pricing", icon: CreditCard },
  { href: "/dashboard/account", label: "Account", icon: Settings2 }
];

export function DashboardSidebar({ username, planName }: { username: string; planName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-5"><Logo /><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Dashboard navigation">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><item.icon className="h-4 w-4" />{item.label}</Link>;
        })}
      </nav>
      <div className="border-t p-4"><div className="rounded-xl bg-slate-50 p-3"><p className="truncate text-sm font-semibold text-slate-950">@{username}</p><p className="mt-0.5 text-xs text-slate-500">{planName} plan</p></div><Button onClick={logout} variant="ghost" className="mt-2 w-full justify-start text-slate-500"><LogOut className="h-4 w-4" />Logout</Button></div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">{nav}</aside>
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur lg:hidden"><Logo compact /><Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button></div>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} aria-label="Close navigation overlay" /><aside className="absolute inset-y-0 left-0 w-[min(86vw,320px)] bg-white shadow-2xl">{nav}</aside></div>}
    </>
  );
}
