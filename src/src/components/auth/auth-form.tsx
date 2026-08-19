"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Authentication failed.");
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      const next = search.get("next");
      router.push(next?.startsWith("/dashboard") ? next : "/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" autoComplete="username" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="your_username" required minLength={3} maxLength={30} /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" required minLength={8} maxLength={128} /></div>
      {mode === "register" && <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Repeat your password" required minLength={8} maxLength={128} /></div>}
      <Button className="w-full" size="lg" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "login" ? "Login" : "Create account"}</Button>
      <p className="text-center text-sm text-slate-500">{mode === "login" ? "New to Skibidi IELTS?" : "Already have an account?"} <Link className="font-semibold text-slate-950 hover:underline" href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Register" : "Login"}</Link></p>
    </form>
  );
}
