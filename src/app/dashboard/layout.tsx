import { requireUser } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <div className="min-h-screen bg-slate-50"><DashboardSidebar username={user.username} planName={user.plan.name} /><main className="lg:pl-64"><div className="mx-auto max-w-7xl p-5 sm:p-7 lg:p-10">{children}</div></main></div>;
}
