import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-950 p-5"><Card className="w-full max-w-md border-white/10 p-8 shadow-2xl"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><ShieldCheck className="h-6 w-6" /></span><h1 className="mt-6 text-2xl font-bold">Skibidi IELTS Admin</h1><p className="mt-2 text-sm leading-6 text-slate-500">Separate privileged authentication for content, users, plans, promo codes, and AI configuration.</p><div className="mt-7"><AdminLoginForm /></div></Card></main>;
}
