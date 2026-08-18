import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getEntitlementSummary } from "@/lib/entitlements/service";
import { getPaymentConfiguration } from "@/lib/payments/service";
import { createPaymentOrderAction, markPaymentTransferredAction } from "@/lib/payments/actions";

export default async function UpgradePage() {
  const user = await requireUser();
  const [entitlement, config, order] = await Promise.all([
    getEntitlementSummary(user.id), getPaymentConfiguration(),
    prisma.paymentOrder.findFirst({ where: { userId: user.id, status: { in: ["PENDING", "AWAITING_VERIFICATION"] } }, orderBy: { createdAt: "desc" } })
  ]);
  return <div><h1 className="text-2xl font-semibold">Upgrade to Pro</h1><p className="muted mt-2">50,000 VND for 30 days · 10 Writing evaluations per Pro cycle.</p>{entitlement.proExpiry && <div className="surface mt-6 p-4 text-sm"><span className="font-medium">Current/scheduled Pro expiry:</span> {entitlement.proExpiry.toLocaleString("en-GB")}. Early renewal adds 30 days after the existing expiry.</div>}
    {!order ? <section className="surface mt-6 max-w-xl p-5"><h2 className="font-semibold">Create payment order</h2><p className="muted mt-2 text-sm">A unique transfer code will be generated for your bank transfer.</p><form action={createPaymentOrderAction} className="mt-5"><button className="btn-primary">Create payment order</button></form></section> : <section className="surface mt-6 max-w-xl p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Bank transfer</h2><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{order.status.replaceAll("_", " ")}</span></div>{config.bankQrImageUrl ? <img src={config.bankQrImageUrl} alt="Bank transfer QR code" className="mt-5 aspect-square w-64 max-w-full border border-gray-200 object-contain" /> : <div className="mt-5 flex aspect-square w-64 max-w-full items-center justify-center border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">Bank QR is not configured yet.</div>}<dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm"><dt className="text-gray-500">Amount</dt><dd className="font-medium">{order.amount.toLocaleString("vi-VN")} VND</dd><dt className="text-gray-500">Bank</dt><dd>{config.bankName || "—"}</dd><dt className="text-gray-500">Account</dt><dd>{config.bankAccountNumber || "—"}</dd><dt className="text-gray-500">Account holder</dt><dd>{config.bankAccountHolder || "—"}</dd><dt className="text-gray-500">Transfer content</dt><dd className="font-mono font-semibold">{order.transferCode}</dd></dl>{order.status === "PENDING" ? <form action={markPaymentTransferredAction} className="mt-6"><input type="hidden" name="orderId" value={order.id} /><button className="btn-primary">I've completed the transfer</button><p className="muted mt-2 text-xs">This does not activate Pro. An admin must confirm the payment.</p></form> : <div className="success-box mt-6 text-sm">Transfer reported. Pro will activate only after admin verification.</div>}</section>}
  </div>;
}
