import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";
const schema=z.object({submissionId:z.string().min(1),category:z.enum(["SCORE_TOO_HIGH","SCORE_TOO_LOW","FEEDBACK_INCORRECT","QUESTION_MISUNDERSTOOD","TASK1_IMAGE_MISUNDERSTOOD","OTHER"]),message:z.string().max(1000).optional()});
export async function POST(request:Request){try{assertSameOrigin(request)}catch{return NextResponse.json({message:"Invalid origin"},{status:403})}const user=await getCurrentUser();if(!user)return NextResponse.json({message:"Unauthorized"},{status:401});const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({message:"Invalid report"},{status:400});const submission=await prisma.writingSubmission.findFirst({where:{id:parsed.data.submissionId,userId:user.id}});if(!submission)return NextResponse.json({message:"Submission not found"},{status:404});await prisma.problemReport.create({data:{userId:user.id,submissionId:submission.id,category:parsed.data.category,message:parsed.data.message?.trim()||null}});return NextResponse.json({ok:true});}
