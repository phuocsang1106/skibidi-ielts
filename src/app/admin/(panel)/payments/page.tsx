import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentReview } from "@/components/admin/payment-review";

export default async function AdminPaymentsPage() {
  const payments = await prisma.bankPaymentRequest.findMany({
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { username: true } },
      plan: { select: { name: true } }
    }
  });

  const ordered = [...payments].sort((a, b) => {
    if (a.status === b.status) return b.createdAt.getTime() - a.createdAt.getTime();
    if (a.status === "PENDING") return -1;
    if (b.status === "PENDING") return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Payments" title="Bank transfer review" />
      <PaymentReview payments={ordered.map((payment) => ({
        id: payment.id,
        username: payment.user.username,
        planName: payment.plan.name,
        amount: payment.amount.toString(),
        transferCode: payment.transferCode,
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
        reviewedAt: payment.reviewedAt?.toISOString() ?? null
      }))} />
    </div>
  );
}
