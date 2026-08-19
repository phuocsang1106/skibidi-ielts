import Link from "next/link";
import { AdminPageHeader, EmptyAdmin, StatusPill } from "@/components/admin/ui";
import { prisma } from "@/lib/db";

export default async function AdminWritingPage({searchParams}:{searchParams:Promise<{q?:string;task?:string}>}){
  const {q,task}=await searchParams; const query=q?.trim()||""; const taskFilter=task==="TASK_1"||task==="TASK_2"?task:undefined;
  const rows=await prisma.writingSubmission.findMany({where:{...(taskFilter?{taskType:taskFilter}:{}),...(query?{OR:[{questionTitle:{contains:query,mode:"insensitive"}},{user:{username:{contains:query,mode:"insensitive"}}}]}:{})},orderBy:{createdAt:"desc"},take:150,include:{user:{select:{username:true}},result:{select:{overallBand:true}},_count:{select:{reports:true}}}});
  const failureIds = rows.length ? await prisma.aiCallLog.groupBy({by:["logicalSubmissionId"],where:{logicalSubmissionId:{in:rows.map(r=>r.id)},status:"FAILURE"},_count:{_all:true}}) : [];
  const failures=new Map(failureIds.map(x=>[x.logicalSubmissionId,x._count._all]));
  return <div><AdminPageHeader title="Writing" description="Inspect persisted grading results and the OpenRouter pipeline metadata recorded for each logical submission."/>
    <form className="mb-5 grid gap-2 sm:grid-cols-[1fr_180px_auto]"><input className="input" name="q" defaultValue={query} placeholder="Search question or username"/><select className="input" name="task" defaultValue={taskFilter||""}><option value="">All tasks</option><option value="TASK_1">Task 1</option><option value="TASK_2">Task 2</option></select><button className="btn btn-secondary">Filter</button></form>
    {rows.length?<div className="table-wrap"><table><thead><tr><th>User</th><th>Task / question</th><th>Plan</th><th>Pipeline</th><th>Band</th><th>Health</th><th>Date</th><th/></tr></thead><tbody>{rows.map(w=><tr key={w.id}><td><Link className="font-medium" href={`/admin/users/${w.userId}`}>{w.user.username}</Link></td><td><div className="text-xs font-semibold text-zinc-400">{w.taskType==="TASK_1"?"Task 1":"Task 2"}</div><div className="max-w-lg truncate font-medium">{w.questionTitle}</div><div className="text-xs text-zinc-400">{w.wordCount} words · {w._count.reports} reports</div></td><td>{w.planNameSnapshot}</td><td>{w.pipelineSize} request{w.pipelineSize===1?"":"s"}</td><td className="font-semibold">{w.result?.overallBand.toFixed(1)||"—"}</td><td>{(failures.get(w.id)||0)>0?<StatusPill value="FAILED"/>:<StatusPill value="SUCCEEDED"/>}</td><td className="text-xs text-zinc-500">{w.createdAt.toLocaleString("en-GB")}</td><td><Link href={`/admin/writing/${w.id}`} className="text-sm font-semibold">Inspect →</Link></td></tr>)}</tbody></table></div>:<EmptyAdmin>No Writing submissions match this view.</EmptyAdmin>}
  </div>;
}
