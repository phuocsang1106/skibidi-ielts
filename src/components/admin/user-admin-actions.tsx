"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UserAdminActions({ userId, username, showHistory = true }: { userId: string; username: string; showHistory?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function impersonate() {
    if (!window.confirm(`Đăng nhập vào tài khoản @${username}? Admin session hiện tại vẫn được giữ.`)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not login as this user.");
      window.location.assign("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not login as this user.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {showHistory ? <Button asChild size="sm" variant="outline"><Link href={`/admin/users/${userId}`}><Eye className="h-4 w-4" />Lịch sử</Link></Button> : null}
      <Button size="sm" onClick={impersonate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Login as user
      </Button>
    </div>
  );
}
