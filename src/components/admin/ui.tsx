import type { ReactNode } from "react";

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{description ? <p className="mt-1 max-w-3xl text-sm text-zinc-500">{description}</p> : null}</div>
    {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
  </div>;
}

export function StatCard({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return <div className="surface p-5"><div className="text-sm text-zinc-500">{label}</div><div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>{detail ? <div className="mt-2 text-xs text-zinc-400">{detail}</div> : null}</div>;
}

const tone: Record<string, string> = {
  PUBLIC: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUCCEEDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  HIDDEN: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  TRANSFER_REPORTED: "bg-blue-50 text-blue-700 border-blue-200",
  OPEN: "bg-red-50 text-red-700 border-red-200",
  REVIEWING: "bg-blue-50 text-blue-700 border-blue-200",
  ARCHIVED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  EXPIRED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  FAILURE: "bg-red-50 text-red-700 border-red-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISMISSED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  QUEUED: "bg-blue-50 text-blue-700 border-blue-200"
};
export function StatusPill({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${tone[value] || "bg-zinc-50 text-zinc-700 border-zinc-200"}`}>{value.replaceAll("_", " ")}</span>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="label">{label}</span>{children}{hint ? <span className="mt-1 block text-xs text-zinc-400">{hint}</span> : null}</label>;
}

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="surface p-5 sm:p-6"><div className="mb-5"><h2 className="font-semibold">{title}</h2>{description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}</div>{children}</section>;
}

export function EmptyAdmin({ children }: { children: ReactNode }) { return <div className="surface p-8 text-center text-sm text-zinc-500">{children}</div>; }
