import { PLAN_FEATURES } from "@/lib/features";
import { Field, Section } from "@/components/admin/ui";

type PlanFormValue = {
  slug?: string; displayName?: string; description?: string; priceVnd?: number; durationDays?: number | null;
  submissionLimit?: number; features?: string[]; visibility?: string; sortOrder?: number; badge?: string | null;
  isActive?: boolean; aiRequestsPerSubmission?: number; defaultModel?: string | null;
  aiConfig?: {
    task1VisionModel?: string | null; task1ExaminerModel?: string | null; task1VerifierModel?: string | null; task1FeedbackModel?: string | null;
    task2ExaminerModel?: string | null; task2VerifierModel?: string | null; task2FeedbackModel?: string | null; task2TeachingModel?: string | null;
  } | null;
};

export function PlanForm({ action, value, submitLabel = "Save plan", destructive }: { action: (formData: FormData) => void | Promise<void>; value?: PlanFormValue; submitLabel?: string; destructive?: React.ReactNode }) {
  const selected = new Set(value?.features || []);
  return <form action={action} className="space-y-5">
    <Section title="Commercial configuration" description="These fields are snapshotted when a purchase or plan grant occurs.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Display name"><input className="input" name="displayName" required defaultValue={value?.displayName || ""}/></Field>
        <Field label="Slug" hint="Lowercase letters, numbers and dashes. It is data, not a TypeScript enum."><input className="input" name="slug" required defaultValue={value?.slug || ""}/></Field>
        <div className="md:col-span-2"><Field label="Description"><textarea className="input min-h-24" name="description" required defaultValue={value?.description || ""}/></Field></div>
        <Field label="Price (VND)"><input className="input" type="number" name="priceVnd" min="0" required defaultValue={value?.priceVnd ?? 0}/></Field>
        <Field label="Duration (days)" hint="Leave blank for non-expiring entitlement."><input className="input" type="number" name="durationDays" min="1" defaultValue={value?.durationDays ?? ""}/></Field>
        <Field label="Writing submission limit"><input className="input" type="number" name="submissionLimit" min="0" required defaultValue={value?.submissionLimit ?? 0}/></Field>
        <Field label="Badge"><input className="input" name="badge" defaultValue={value?.badge || ""} placeholder="Popular"/></Field>
        <Field label="Visibility"><select className="input" name="visibility" defaultValue={value?.visibility || "PUBLIC"}><option value="PUBLIC">Public</option><option value="HIDDEN">Hidden</option><option value="ARCHIVED">Archived</option></select></Field>
        <Field label="Sort order"><input className="input" type="number" name="sortOrder" defaultValue={value?.sortOrder ?? 0}/></Field>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isActive" defaultChecked={value?.isActive ?? true}/> Operationally active</label>
      </div>
    </Section>

    <Section title="Feature entitlements" description="The product UI reads these feature keys at runtime. Admin-created plans therefore work without plan-name conditionals.">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(PLAN_FEATURES).map(([key, feature]) => <label key={key} className="flex gap-3 rounded-xl border border-zinc-200 p-3 text-sm"><input className="mt-0.5" type="checkbox" name="features" value={key} defaultChecked={selected.has(key)}/><span><span className="font-medium">{feature.label}</span><span className="mt-0.5 block text-xs text-zinc-400">{feature.description}</span></span></label>)}</div>
    </Section>

    <Section title="AI pipeline" description="Operational AI configuration is not part of the commercial snapshot. Changes apply to future submissions without redeploying.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="AI requests per submission" hint="Runtime pipeline size: 1–4. One successful learner submission still consumes one credit."><select className="input" name="aiRequestsPerSubmission" defaultValue={value?.aiRequestsPerSubmission ?? 1}>{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="Default model" hint="OpenRouter model ID; empty falls back to OPENROUTER_MODEL."><input className="input" name="defaultModel" defaultValue={value?.defaultModel || ""} placeholder="google/gemini-..."/></Field>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Task 1 Vision"><input className="input" name="task1VisionModel" defaultValue={value?.aiConfig?.task1VisionModel || ""}/></Field>
        <Field label="Task 1 Examiner"><input className="input" name="task1ExaminerModel" defaultValue={value?.aiConfig?.task1ExaminerModel || ""}/></Field>
        <Field label="Task 1 Verifier"><input className="input" name="task1VerifierModel" defaultValue={value?.aiConfig?.task1VerifierModel || ""}/></Field>
        <Field label="Task 1 Feedback"><input className="input" name="task1FeedbackModel" defaultValue={value?.aiConfig?.task1FeedbackModel || ""}/></Field>
        <Field label="Task 2 Examiner"><input className="input" name="task2ExaminerModel" defaultValue={value?.aiConfig?.task2ExaminerModel || ""}/></Field>
        <Field label="Task 2 Verifier"><input className="input" name="task2VerifierModel" defaultValue={value?.aiConfig?.task2VerifierModel || ""}/></Field>
        <Field label="Task 2 Feedback"><input className="input" name="task2FeedbackModel" defaultValue={value?.aiConfig?.task2FeedbackModel || ""}/></Field>
        <Field label="Task 2 Teaching"><input className="input" name="task2TeachingModel" defaultValue={value?.aiConfig?.task2TeachingModel || ""}/></Field>
      </div>
    </Section>

    {value ? <Section title="Change note"><Field label="Reason (optional)"><input className="input" name="reason" placeholder="Why this plan changed"/></Field></Section> : null}
    <div className="flex flex-wrap items-center gap-2"><button className="btn btn-primary" type="submit">{submitLabel}</button>{destructive}</div>
  </form>;
}
