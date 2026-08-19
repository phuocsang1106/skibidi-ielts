import { Field, Section } from "@/components/admin/ui";

type PromoValue = { code?:string; rewardType?:string; grantPlanId?:string|null; grantDurationDays?:number|null; addSubmissions?:number|null; maxTotalRedemptions?:number|null; redemptionLimitPerUser?:number; expiresAt?:Date|null; isActive?:boolean; activationBehavior?:string };
export function AdminPromoForm({ action, plans, value, submitLabel="Save promo", destructive }: { action:(fd:FormData)=>void|Promise<void>; plans:{id:string;displayName:string;visibility:string}[]; value?:PromoValue; submitLabel?:string; destructive?:React.ReactNode }) {
  const date = value?.expiresAt ? value.expiresAt.toISOString().slice(0,16) : "";
  return <form action={action} className="space-y-5">
    <Section title="Promo definition" description="V2 intentionally supports exactly two reward types: grant a plan or add Writing submissions.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Code"><input className="input uppercase" name="code" required defaultValue={value?.code||""}/></Field>
        <Field label="Reward type"><select className="input" name="rewardType" defaultValue={value?.rewardType||"GRANT_PLAN"}><option value="GRANT_PLAN">Grant plan</option><option value="ADD_SUBMISSIONS">Add submissions</option></select></Field>
        <Field label="Target plan" hint="Used only for Grant plan."><select className="input" name="grantPlanId" defaultValue={value?.grantPlanId||""}><option value="">— None —</option>{plans.map(p=><option value={p.id} key={p.id}>{p.displayName} · {p.visibility}</option>)}</select></Field>
        <Field label="Grant duration override (days)" hint="Leave blank to use the plan default."><input className="input" name="grantDurationDays" type="number" min="1" defaultValue={value?.grantDurationDays??""}/></Field>
        <Field label="Submissions to add" hint="Used only for Add submissions."><input className="input" name="addSubmissions" type="number" min="1" defaultValue={value?.addSubmissions??""}/></Field>
        <Field label="Activation behavior" hint="Safe default queues a plan behind a current entitlement."><select className="input" name="activationBehavior" defaultValue={value?.activationBehavior||"QUEUE_AFTER_CURRENT"}><option value="QUEUE_AFTER_CURRENT">Queue after current</option><option value="ACTIVATE_NOW">Activate now</option></select></Field>
      </div>
    </Section>
    <Section title="Redemption limits">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Maximum total redemptions" hint="Leave blank for no global maximum."><input className="input" name="maxTotalRedemptions" type="number" min="1" defaultValue={value?.maxTotalRedemptions??""}/></Field>
        <Field label="Per-user redemption limit"><input className="input" required name="redemptionLimitPerUser" type="number" min="1" defaultValue={value?.redemptionLimitPerUser??1}/></Field>
        <Field label="Expiration"><input className="input" name="expiresAt" type="datetime-local" defaultValue={date}/></Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium"><input type="checkbox" name="isActive" defaultChecked={value?.isActive??true}/> Active</label>
      </div>
    </Section>
    <div className="flex flex-wrap gap-2"><button className="btn btn-primary" type="submit">{submitLabel}</button>{destructive}</div>
  </form>;
}
