import { PageHeader } from "@/components/page-header";
import { WritingForm } from "@/components/writing-form";
import { requireUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/services/credits";

export default async function WritingPage() {
  const user = await requireUser();
  const credits = await getCreditSummary(user.id);
  return <><PageHeader title="IELTS Writing" description="Submit Task 1 or Task 2 for AI-assisted evaluation against the IELTS May 2023 descriptors."/><WritingForm remaining={credits.totalRemaining}/></>;
}
