"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createPaymentOrder, markPaymentTransferred } from "@/lib/payments/service";

export async function createPaymentOrderAction() {
  const user = await requireUser();
  await createPaymentOrder(user.id);
  revalidatePath("/app/upgrade");
}

export async function markPaymentTransferredAction(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return;
  await markPaymentTransferred(user.id, orderId);
  revalidatePath("/app/upgrade");
}
