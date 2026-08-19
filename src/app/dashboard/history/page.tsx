import Link from "next/link";
import { Clock3, Eye } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePlanFeatures } from "@/lib/plan-features";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await prisma.writingSubmission.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <div className="space-y-8"><PageHeader eyebrow="Archive" title="Writing history" />{items.length ? <div className="overflow-hidden rounded-2xl border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-4 font-semibold">Date</th><th className="px-5 py-4 font-semibold">Task type</th><th className="px-5 py-4 font-semibold">Band score</th><th className="px-5 py-4 text-right font-semibold">Result</th></tr></thead><tbody className="divide-y">{items.map((item) => {
    const features = parsePlanFeatures(item.featuresSnapshot);
    return <tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-4 text-slate-500">{formatDate(item.createdAt)}</td><td className="px-5 py-4 font-medium">{item.taskType === "TASK_1" ? "IELTS Writing Task 1" : "IELTS Writing Task 2"}</td><td className="px-5 py-4">{features.bandScore ? <Badge className="bg-red-50 text-red-600">Band {item.bandScore.toString()}</Badge> : <span className="text-xs font-medium text-slate-400">Not included</span>}</td><td className="px-5 py-4 text-right"><Button asChild variant="ghost" size="sm"><Link href={`/dashboard/history/${item.id}`}><Eye className="h-4 w-4" />View result</Link></Button></td></tr>;
  })}</tbody></table></div></div> : <EmptyState icon={Clock3} title="No submissions yet" description="Your graded Task 1 and Task 2 writing will appear here." />}</div>;
}
