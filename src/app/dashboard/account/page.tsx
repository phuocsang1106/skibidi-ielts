import { CalendarDays, Gift, ShieldCheck, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PromoForm } from "@/components/dashboard/promo-form";
import { PasswordForm } from "@/components/dashboard/password-form";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Profile" title="Account" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100"><UserRound className="h-5 w-5" /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Username</p><p className="mt-1 text-lg font-semibold">{user.username}</p>
          <div className="my-5 h-px bg-slate-100" />
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current plan</p><Badge className="mt-2">{user.plan.name}</Badge>
          {user.planExpireDate && <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5" />{formatDate(user.planExpireDate)}</p>}
        </Card>
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Gift className="h-5 w-5" /></span><h2 className="font-semibold">Promo code</h2></div>
          <div className="mt-6"><PromoForm /></div>
        </Card>
      </div>
      <Card className="p-6">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><ShieldCheck className="h-5 w-5" /></span><h2 className="font-semibold">Security</h2></div>
        <div className="mt-6 max-w-2xl"><PasswordForm /></div>
      </Card>
    </div>
  );
}
