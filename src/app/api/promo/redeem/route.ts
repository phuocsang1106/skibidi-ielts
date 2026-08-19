import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { redeemPromo } from "@/lib/services/promo";
import { toPublicError } from "@/lib/errors";
export async function POST(request:Request){try{assertSameOrigin(request);const user=await getCurrentUser();if(!user)return NextResponse.json({message:"Please log in."},{status:401});const body=await request.json() as {code?:unknown};const result=await redeemPromo(user.id,typeof body.code==="string"?body.code:"");return NextResponse.json({ok:true,result});}catch(error){const e=toPublicError(error);return NextResponse.json({ok:false,message:e.message,code:e.code},{status:e.status});}}
