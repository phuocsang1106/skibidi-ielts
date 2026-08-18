import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="app-shell">
      <AppNav username={user.username} role={user.role} />
      <main className="app-main">
        <div className="app-content">
          <Suspense fallback={<div className="page-loading">Loading…</div>}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
