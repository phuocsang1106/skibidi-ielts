import { requireUser } from "@/lib/auth";
import { getQuota } from "@/lib/quota";
import { PageHeader } from "@/components/dashboard/page-header";
import { WritingForm } from "@/components/writing/writing-form";
import { Badge } from "@/components/ui/badge";

export default async function WritingPage() {
  const user = await requireUser();
  const quota = await getQuota(user);
  return <div className="space-y-8"><PageHeader eyebrow="AI examiner" title="IELTS Writing AI" action={<Badge className={quota.remaining > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}>{quota.remaining} lượt còn lại</Badge>} /><WritingForm remaining={quota.remaining} /></div>;
}
