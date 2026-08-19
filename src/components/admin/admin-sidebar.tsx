"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, Bot, CreditCard, LogOut, Menu, ShieldCheck, Tags, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/promos", label: "Promo codes", icon: Tags },
  { href: "/admin/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/admin/ai-settings", label: "AI Settings", icon: Bot }
];

export function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  async function logout() { await fetch("/api/admin/auth/logout", { method: "POST" }); router.push("/admin/login"); router.refresh(); }
  const panel = <div className="flex h-full flex-col bg-slate-950 text-white"><div className="flex h-16 items-center justify-between border-b border-white/10 px-5"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-950"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-sm font-bold">Skibidi Admin</p><p className="text-[10px] text-slate-500">@{username}</p></div></div><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close admin navigation"><X className="h-5 w-5" /></button></div><nav className="flex-1 space-y-1 p-3">{items.map((item) => { const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white")}><item.icon className="h-4 w-4" />{item.label}</Link>; })}</nav><div className="border-t border-white/10 p-3"><Button onClick={logout} variant="ghost" className="w-full justify-start text-slate-400 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />Logout</Button></div></div>;
  return <><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{panel}</aside><div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-slate-950 px-4 text-white lg:hidden"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5" />Skibidi Admin</div><Button size="icon" variant="ghost" onClick={() => setOpen(true)} className="text-white hover:bg-white/10 hover:text-white" aria-label="Open admin navigation"><Menu className="h-5 w-5" /></Button></div>{open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Close admin overlay" /><aside className="absolute inset-y-0 left-0 w-[min(86vw,320px)]">{panel}</aside></div>}</>;
}
