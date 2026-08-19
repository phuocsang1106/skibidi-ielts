import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { reportTransfer } from "@/lib/services/payments";
export async function POST(request:Request){try{assertSameOrigin(request)}catch{return new NextResponse("Invalid origin",{status:403})}const user=await getCurrentUser();if(!user)return NextResponse.redirect(new URL("/login",request.url),303);const form=await request.formData();const orderId=String(form.get("orderId")||"");try{await reportTransfer(user.id,orderId);return NextResponse.redirect(new URL(`/app/pricing?order=${encodeURIComponent(orderId)}&reported=1`,request.url),303)}catch{return NextResponse.redirect(new URL(`/app/pricing?order=${encodeURIComponent(orderId)}&error=Could+not+report+transfer`,request.url),303)}}
