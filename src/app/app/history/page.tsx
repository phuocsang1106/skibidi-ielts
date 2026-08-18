import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await prisma.writingSubmission.findMany({ where: { userId: user.id, status: "COMPLETED" }, orderBy: { completedAt: "desc" } });
  return <div><h1 className="text-2xl font-semibold">Writing History</h1><p className="muted mt-2">Previous results remain available, including Pro feedback generated while your account was Pro.</p><div className="mt-7 space-y-3">{items.length ? items.map(item => <Link href={`/app/history/${item.id}`} key={item.id} className="surface flex flex-wrap items-center justify-between gap-4 p-4 hover:border-gray-300"><div><div className="font-medium">{item.taskType === "TASK_1" ? "Task 1" : "Task 2"} · Estimated Band {item.estimatedOverallBand?.toFixed(1)}</div><div className="muted mt-1 text-sm">{item.wordCount} words · {item.completedAt?.toLocaleString("en-GB")}</div></div><span className="text-sm font-medium text-blue-700">View feedback</span></Link>) : <div className="surface p-5"><p className="font-medium">No Writing submissions yet</p><p className="muted mt-1 text-sm">Start your first IELTS Writing evaluation.</p><Link href="/app/writing" className="btn-primary mt-4">Start Writing</Link></div>}</div></div>;
}
