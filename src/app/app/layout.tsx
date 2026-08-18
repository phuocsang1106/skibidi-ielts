import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <div className="min-h-screen bg-[#fbfbfa]"><AppNav username={user.username} admin={user.role === "ADMIN"} /><main className="pb-20 md:ml-60 md:pb-0"><div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10"><Suspense fallback={<div className="py-10 text-sm text-gray-500">Loading…</div>}>{children}</Suspense></div></main></div>;
}
