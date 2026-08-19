import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", inverse ? "text-white" : "text-slate-950")} aria-label="Skibidi IELTS home">
      <span className={cn("grid h-9 w-9 place-items-center rounded-xl shadow-sm", inverse ? "bg-white text-slate-950" : "bg-slate-950 text-white")}><GraduationCap className="h-5 w-5" /></span>
      {!compact && <span>Skibidi IELTS</span>}
    </Link>
  );
}
