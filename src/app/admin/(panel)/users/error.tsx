"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminUsersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("admin_users_error", error);
  }, [error]);

  return (
    <Card className="p-8">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
        <div>
          <h2 className="font-semibold">Không tải được dữ liệu user</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Có lỗi khi mở danh sách hoặc lịch sử bài nộp. Bạn có thể thử tải lại phần này.</p>
          <Button className="mt-4" size="sm" onClick={reset}>Thử lại</Button>
        </div>
      </div>
    </Card>
  );
}
