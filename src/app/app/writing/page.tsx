import { requireUser } from "@/lib/auth/session";
import { getEntitlementSummary } from "@/lib/entitlements/service";
import { WritingForm } from "@/components/writing-form";

export default async function WritingPage() {
  const user = await requireUser(); const entitlement = await getEntitlementSummary(user.id);
  return <div><h1 className="text-2xl font-semibold">IELTS Writing</h1><p className="muted mt-2">Upload or paste your task and response. Scores are labeled Estimated IELTS Band because they are not official IELTS results.</p><WritingForm remaining={entitlement.quotaRemaining} limit={entitlement.quotaLimit} resetAt={entitlement.resetAt.toISOString()} /></div>;
}
