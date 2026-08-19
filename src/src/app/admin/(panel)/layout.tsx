import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <div className="min-h-screen bg-slate-100"><AdminSidebar username={admin.username} /><main className="lg:pl-64"><div className="mx-auto max-w-7xl p-5 sm:p-7 lg:p-10">{children}</div></main></div>;
}
