import { prisma } from "@/lib/prisma";
import { parsePlanFeatures } from "@/lib/plan-features";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlanManager } from "@/components/admin/plan-manager";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
  return <div className="space-y-8"><PageHeader eyebrow="Subscription config" title="Plans" description="Create, edit, hide/show, price, quota, model, duration, and feature flags. Model values use OpenRouter slugs such as google/..., openai/..., deepseek/..." /><PlanManager plans={plans.map((plan) => ({ id: plan.id, name: plan.name, price: plan.price.toString(), durationDays: plan.durationDays, aiRequestLimit: plan.aiRequestLimit, aiModel: plan.aiModel, isVisible: plan.isVisible, isFree: plan.isFree, features: parsePlanFeatures(plan.features) }))} /></div>;
}
