import { requireUser } from "@/lib/auth/session";
import { getEntitlementSummary } from "@/lib/entitlements/service";
import { WritingForm } from "@/components/writing-form";

export default async function WritingPage() {
  const user = await requireUser();
  const entitlement = await getEntitlementSummary(user.id);
  return (
    <div>
      <h1 className="page-title">IELTS Writing</h1>
      <WritingForm remaining={entitlement.quotaRemaining} limit={entitlement.quotaLimit} resetAt={entitlement.resetAt.toISOString()} />
    </div>
  );
}
