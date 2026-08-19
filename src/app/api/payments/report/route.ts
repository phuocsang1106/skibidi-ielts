import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin, publicAppUrl } from "@/lib/security";
import { reportTransfer } from "@/lib/services/payments";
export async function POST(request:Request){try{assertSameOrigin(request)}catch{return new NextResponse("Invalid origin",{status:403})}const user=await getCurrentUser();if(!user)return NextResponse.redirect(publicAppUrl("/login", request),303);const form=await request.formData();const orderId=String(form.get("orderId")||"");try{await reportTransfer(user.id,orderId);return NextResponse.redirect(publicAppUrl(`/app/pricing?order=${encodeURIComponent(orderId)}&reported=1`, request),303)}catch{return NextResponse.redirect(publicAppUrl(`/app/pricing?order=${encodeURIComponent(orderId)}&error=Could+not+report+transfer`, request),303)}}
