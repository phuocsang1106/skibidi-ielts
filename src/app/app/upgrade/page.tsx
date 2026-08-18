import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getEntitlementSummary } from "@/lib/entitlements/service";
import { getPaymentConfiguration } from "@/lib/payments/service";
import { createPaymentOrderAction, markPaymentTransferredAction } from "@/lib/payments/actions";

export default async function UpgradePage() {
  const user = await requireUser();
  const [entitlement, config, order] = await Promise.all([
    getEntitlementSummary(user.id),
    getPaymentConfiguration(),
    prisma.paymentOrder.findFirst({ where: { userId: user.id, status: { in: ["PENDING", "AWAITING_VERIFICATION"] } }, orderBy: { createdAt: "desc" } }),
  ]);

  return <div className="upgrade-v7"><div className="upgrade-v7-head"><div><h1 className="page-title">Upgrade to Pro</h1><p>50,000 VND · 30 days · 10 Writing submissions</p></div></div>
    {entitlement.proExpiry && <div className="upgrade-v7-note">Current/scheduled Pro expiry: <strong>{entitlement.proExpiry.toLocaleString("en-GB")}</strong>. Early renewal adds 30 days after the existing expiry.</div>}
    {!order ? <section className="upgrade-v7-card"><div className="upgrade-v7-icon" aria-hidden="true">↗</div><div><h2>Create payment order</h2><p>A unique bank-transfer code will be generated for your payment.</p><form action={createPaymentOrderAction}><button className="btn-primary">Create payment order</button></form></div></section> : <section className="upgrade-v7-card upgrade-v7-payment"><div className="upgrade-v7-payment-top"><div><h2>Bank transfer</h2><p>Use the QR code or bank details below.</p></div><span className="payment-status">{order.status.replaceAll("_", " ")}</span></div><div className="upgrade-v7-payment-grid">{config.bankQrImageUrl ? <img src={config.bankQrImageUrl} alt="Bank transfer QR code" className="payment-qr" /> : <div className="payment-qr payment-qr-empty">QR not configured</div>}<dl className="payment-details"><div><dt>Amount</dt><dd>{order.amount.toLocaleString("vi-VN")} VND</dd></div><div><dt>Bank</dt><dd>{config.bankName || "—"}</dd></div><div><dt>Account</dt><dd>{config.bankAccountNumber || "—"}</dd></div><div><dt>Account holder</dt><dd>{config.bankAccountHolder || "—"}</dd></div><div className="payment-code"><dt>Transfer content</dt><dd>{order.transferCode}</dd></div></dl></div>{order.status === "PENDING" ? <form action={markPaymentTransferredAction} className="payment-action"><input type="hidden" name="orderId" value={order.id} /><button className="btn-primary">I've completed the transfer</button><p>This only reports your transfer. Pro activates after admin verification.</p></form> : <div className="success-box payment-waiting">Transfer reported. Pro will activate after admin verification.</div>}</section>}
  </div>;
}
