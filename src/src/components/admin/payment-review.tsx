"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";

type PaymentRow = {
  id: string;
  username: string;
  planName: string;
  amount: string;
  transferCode: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
};

function statusBadge(status: string) {
  if (status === "APPROVED") return <Badge className="bg-emerald-50 text-emerald-700">Đã duyệt</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-50 text-red-600">Đã từ chối</Badge>;
  return <Badge className="bg-amber-50 text-amber-700">Chờ duyệt</Badge>;
}

export function PaymentReview({ payments }: { payments: PaymentRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function review(id: string, action: "APPROVE" | "REJECT") {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Không thể xử lý thanh toán.");
      toast.success(action === "APPROVE" ? "Đã duyệt và kích hoạt gói cho user." : "Đã từ chối yêu cầu.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xử lý thanh toán.");
    } finally {
      setLoadingId(null);
    }
  }

  if (!payments.length) {
    return <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500">Chưa có yêu cầu thanh toán.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-4 font-semibold">User</th>
              <th className="px-5 py-4 font-semibold">Plan</th>
              <th className="px-5 py-4 font-semibold">Amount</th>
              <th className="px-5 py-4 font-semibold">Transfer content</th>
              <th className="px-5 py-4 font-semibold">Created</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => (
              <tr key={payment.id} className="align-middle">
                <td className="px-5 py-4 font-semibold">{payment.username}</td>
                <td className="px-5 py-4">{payment.planName}</td>
                <td className="px-5 py-4 font-semibold">{formatPrice(payment.amount)}</td>
                <td className="px-5 py-4"><code className="rounded-lg bg-slate-100 px-2 py-1 font-bold">{payment.transferCode}</code></td>
                <td className="px-5 py-4 text-slate-500">{formatDate(payment.createdAt)}</td>
                <td className="px-5 py-4">{statusBadge(payment.status)}</td>
                <td className="px-5 py-4">
                  {payment.status === "PENDING" ? (
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" onClick={() => review(payment.id, "APPROVE")} disabled={loadingId === payment.id}>
                        {loadingId === payment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Approve
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => review(payment.id, "REJECT")} disabled={loadingId === payment.id} className="text-red-600">
                        <XCircle className="h-4 w-4" />Reject
                      </Button>
                    </div>
                  ) : <p className="text-right text-xs text-slate-400">{payment.reviewedAt ? formatDate(payment.reviewedAt) : "Reviewed"}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
