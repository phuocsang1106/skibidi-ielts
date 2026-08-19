import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm"><Icon className="h-5 w-5 text-slate-600" /></span>
      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
