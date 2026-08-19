import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { createPaymentOrder } from "@/lib/services/payments";
export async function POST(request:Request){try{assertSameOrigin(request)}catch{return new NextResponse("Invalid origin",{status:403})}const user=await getCurrentUser();if(!user)return NextResponse.redirect(new URL("/login",request.url),303);const form=await request.formData();const planId=String(form.get("planId")||"");try{const order=await createPaymentOrder(user.id,planId);return NextResponse.redirect(new URL(`/app/pricing?order=${encodeURIComponent(order.id)}`,request.url),303)}catch{return NextResponse.redirect(new URL("/app/pricing?error=Plan+is+not+available",request.url),303)}}
