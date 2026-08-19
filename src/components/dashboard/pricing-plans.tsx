"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Clock3, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PlanFeatures } from "@/types/feedback";

type PricingPlan = {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  aiRequestLimit: number;
  isFree: boolean;
  features: PlanFeatures;
  active: boolean;
};

type PaymentSummary = {
  id: string;
  planId: string;
  status: string;
  transferCode: string;
  amount: string;
  planName: string;
  durationDays: number;
};

function featureLabels(plan: PricingPlan) {
  return [
    `${plan.aiRequestLimit} lượt chấm Writing`,
    plan.features.bandScore && "Overall Band Score",
    plan.features.criteria && "4 tiêu chí IELTS",
    plan.features.errorCorrection && "Sửa lỗi chi tiết",
    plan.features.band7Sample && "Bài mẫu Band 7",
    plan.features.improvedEssay && "Bài viết cải thiện hoàn chỉnh",
    plan.features.nextBandGuidance && "Hướng dẫn tăng band"
  ].filter(Boolean) as string[];
}

export function PricingPlans({ plans, pendingPayments, latestStatuses }: { plans: PricingPlan[]; pendingPayments: PaymentSummary[]; latestStatuses: Array<{ planId: string; status: string }> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<PricingPlan | null>(null);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const pendingByPlan = useMemo(() => new Map(pendingPayments.map((item) => [item.planId, item])), [pendingPayments]);
  const statusByPlan = useMemo(() => new Map(latestStatuses.map((item) => [item.planId, item.status])), [latestStatuses]);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  function openPlan(plan: PricingPlan) {
    setSelected(plan);
    setPayment(pendingByPlan.get(plan.id) ?? null);
  }

  function closeModal() {
    if (loading) return;
    setSelected(null);
    setPayment(null);
  }

  async function createPayment() {
    if (!selected) return;
    setLoading(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selected.id })
      });
      const payload = (await response.json()) as Omit<PaymentSummary, "planId"> & { error?: string };
      if (!response.ok || !payload.id) throw new Error(payload.error ?? "Không thể tạo yêu cầu thanh toán.");
      setPayment({ ...payload, planId: selected.id });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo yêu cầu thanh toán.");
    } finally {
      setLoading(false);
    }
  }

  async function copyTransferCode() {
    if (!payment) return;
    await navigator.clipboard.writeText(payment.transferCode);
    toast.success("Đã sao chép nội dung chuyển khoản.");
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const pending = pendingByPlan.get(plan.id);
          const latestStatus = statusByPlan.get(plan.id);
          return (
            <Card
              key={plan.id}
              className={cn(
                "flex min-h-[500px] flex-col bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg",
                plan.active && "border-slate-950 ring-1 ring-slate-950"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                {plan.active && <Badge className="bg-slate-950 text-white">Hiện tại</Badge>}
              </div>

              <p className="mt-6 text-3xl font-black tracking-tight">{formatPrice(plan.price)}</p>
              <p className="mt-1 text-sm text-slate-500">{plan.isFree ? "Gói miễn phí" : `${plan.durationDays} ngày`}</p>

              <div className="my-6 h-px bg-slate-100" />
              <div className="space-y-3 text-sm text-slate-700">
                {featureLabels(plan).map((label) => (
                  <p key={label} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {label}
                  </p>
                ))}
              </div>

              <div className="mt-auto pt-8">
                {pending && <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-amber-700"><Clock3 className="h-3.5 w-3.5" />Đang chờ admin xác nhận</p>}
                {!pending && latestStatus === "REJECTED" && <p className="mb-3 text-xs font-semibold text-red-600">Yêu cầu gần nhất đã bị từ chối</p>}
                {plan.isFree || plan.active ? (
                  <Button disabled className="w-full" variant="outline">{plan.active ? "Gói hiện tại" : "Gói miễn phí"}</Button>
                ) : (
                  <Button type="button" onClick={() => openPlan(plan)} className="w-full" variant="outline">
                    {pending ? "Xem thanh toán" : `Chọn ${plan.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4 sm:p-6">
          <button type="button" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeModal} aria-label="Đóng thanh toán" />
          <div role="dialog" aria-modal="true" aria-labelledby="payment-title" className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl">
            <button type="button" onClick={closeModal} className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-100 transition hover:bg-slate-200" aria-label="Đóng"><X className="h-4 w-4" /></button>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="bg-slate-950 p-7 text-white sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Thanh toán chuyển khoản</p>
                <h2 id="payment-title" className="mt-3 text-3xl font-black">{selected.name}</h2>
                <p className="mt-2 text-3xl font-black text-emerald-400">{formatPrice(selected.price)}</p>
                <div className="mt-8 space-y-4 text-sm text-slate-300">
                  <p className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />Yêu cầu được admin kiểm tra và xác nhận thủ công.</p>
                  <p className="flex gap-3"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />Sau khi duyệt, gói được kích hoạt trong {selected.durationDays} ngày.</p>
                </div>
              </div>

              <div className="p-7 sm:p-9">
                {!payment ? (
                  <div className="flex min-h-[360px] flex-col justify-center">
                    <h3 className="text-xl font-bold">Tạo mã thanh toán</h3>
                    <p className="mt-3 leading-7 text-slate-600">Hệ thống sẽ tạo nội dung chuyển khoản riêng cho tài khoản của bạn. Sau đó quét QR và chuyển đúng số tiền hiển thị.</p>
                    <Button type="button" size="lg" onClick={createPayment} disabled={loading} className="mt-7 w-full">
                      {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Đang tạo...</> : "Hiển thị QR thanh toán"}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto w-full max-w-[330px] rounded-3xl border bg-white p-3 shadow-sm">
                      <Image src="/bank-transfer-qr.png" alt="QR chuyển khoản ngân hàng" width={938} height={938} className="h-auto w-full rounded-2xl" priority />
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Số tiền</p>
                        <p className="mt-1 text-lg font-black">{formatPrice(payment.amount)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trạng thái</p>
                        <p className="mt-1 flex items-center gap-2 font-bold text-amber-700"><Clock3 className="h-4 w-4" />Chờ xác nhận</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nội dung chuyển khoản</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <code className="text-lg font-black tracking-wider text-slate-950">{payment.transferCode}</code>
                        <Button type="button" variant="outline" size="sm" onClick={copyTransferCode}><Clipboard className="h-4 w-4" />Copy</Button>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-sm font-medium text-red-600">Chuyển đúng số tiền và đúng nội dung để admin đối soát.</p>
                    <Button type="button" size="lg" onClick={closeModal} className="mt-5 w-full">Tôi đã chuyển khoản</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
