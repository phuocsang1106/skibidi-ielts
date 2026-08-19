"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PromoForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);
    try {
      const response = await fetch("/api/promo/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const payload = (await response.json()) as { error?: string; plan?: string };
      if (!response.ok) throw new Error(payload.error ?? "Invalid promo code.");
      toast.success(`Upgraded to ${payload.plan ?? "new plan"}.`); setCode(""); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not redeem code."); } finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row"><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="SKIBIDI30" maxLength={40} className="font-mono uppercase" required /><Button disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}Redeem code</Button></form>;
}
