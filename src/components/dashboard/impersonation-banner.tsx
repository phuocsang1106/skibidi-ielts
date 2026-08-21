"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner({ adminUsername, userId, userUsername }: { adminUsername: string; userId: string; userUsername: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function stopImpersonation() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/impersonation/stop", { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not return to admin.");
      router.push(`/admin/users/${userId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not return to admin.");
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm text-amber-950">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p><span className="font-semibold">Admin @{adminUsername}</span> đang đăng nhập với tư cách <span className="font-semibold">@{userUsername}</span>. Mọi thao tác trong dashboard sẽ tác động lên tài khoản user này.</p>
        </div>
        <Button size="sm" variant="outline" onClick={stopImpersonation} disabled={loading} className="shrink-0 border-amber-300 bg-white hover:bg-amber-100">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Quay lại Admin
        </Button>
      </div>
    </div>
  );
}
