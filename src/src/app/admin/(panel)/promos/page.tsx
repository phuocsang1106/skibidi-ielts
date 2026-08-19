import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { PromoManager } from "@/components/admin/promo-manager";

export default async function AdminPromosPage() {
  const [promos, plans] = await Promise.all([prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }), prisma.plan.findMany({ select: { id: true, name: true }, orderBy: { price: "asc" } })]);
  return <div className="space-y-8"><PageHeader eyebrow="Growth" title="Promo codes" description="Create reward codes such as SKIBIDI30, map each code to a plan, and control duration, expiry, activation, and usage limit." /><PromoManager plans={plans} promos={promos.map((promo) => ({ id: promo.id, code: promo.code, planId: promo.planId, duration: promo.duration, isActive: promo.isActive, maxUses: promo.maxUses, usedCount: promo.usedCount, expiresAt: promo.expiresAt?.toISOString() ?? null }))} /></div>;
}
