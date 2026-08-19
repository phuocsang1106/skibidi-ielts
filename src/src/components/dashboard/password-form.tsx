"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setLoading(true);
    try {
      const response = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword"), confirmPassword: form.get("confirmPassword") }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update password.");
      toast.success("Password updated."); event.currentTarget.reset();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update password."); } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="currentPassword">Current password</Label><Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="newPassword">New password</Label><Input id="newPassword" name="newPassword" type="password" minLength={8} autoComplete="new-password" required /></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm new password</Label><Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></div></div><Button disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Change password</Button></form>;
}
