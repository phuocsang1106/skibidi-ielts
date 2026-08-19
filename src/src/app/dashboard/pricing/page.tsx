import { Gift } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePlanFeatures } from "@/lib/plan-features";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { PromoForm } from "@/components/dashboard/promo-form";
import { PricingPlans } from "@/components/dashboard/pricing-plans";

export default async function PricingPage() {
  const user = await requireUser();
  const [plans, paymentRows] = await Promise.all([
    prisma.plan.findMany({ where: { isVisible: true }, orderBy: { price: "asc" } }),
    prisma.bankPaymentRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { plan: { select: { name: true, durationDays: true } } }
    })
  ]);
  const pendingPayments = paymentRows.filter((payment) => payment.status === "PENDING");
  const latestByPlan = new Map<string, string>();
  for (const payment of paymentRows) {
    if (!latestByPlan.has(payment.planId)) latestByPlan.set(payment.planId, payment.status);
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Subscription" title="Pricing" />
      <PricingPlans
        plans={plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price.toString(),
          durationDays: plan.durationDays,
          aiRequestLimit: plan.aiRequestLimit,
          isFree: plan.isFree,
          features: parsePlanFeatures(plan.features),
          active: plan.id === user.planId
        }))}
        pendingPayments={pendingPayments.map((payment) => ({
          id: payment.id,
          planId: payment.planId,
          status: payment.status,
          transferCode: payment.transferCode,
          amount: payment.amount.toString(),
          planName: payment.plan.name,
          durationDays: payment.plan.durationDays
        }))}
        latestStatuses={[...latestByPlan.entries()].map(([planId, status]) => ({ planId, status }))}
      />
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Gift className="h-5 w-5" /></span>
          <h2 className="font-semibold">Promo code</h2>
        </div>
        <div className="mt-5 max-w-xl"><PromoForm /></div>
      </Card>
    </div>
  );
}
