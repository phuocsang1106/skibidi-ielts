ALTER TABLE "WritingSubmission"
ADD COLUMN "taskPrompt" TEXT,
ADD COLUMN "promptAttachmentName" TEXT;

CREATE TABLE "BankPaymentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "transferCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "BankPaymentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BankPaymentRequest_transferCode_key" ON "BankPaymentRequest"("transferCode");
CREATE INDEX "BankPaymentRequest_userId_createdAt_idx" ON "BankPaymentRequest"("userId", "createdAt");
CREATE INDEX "BankPaymentRequest_planId_idx" ON "BankPaymentRequest"("planId");
CREATE INDEX "BankPaymentRequest_status_createdAt_idx" ON "BankPaymentRequest"("status", "createdAt");

ALTER TABLE "BankPaymentRequest" ADD CONSTRAINT "BankPaymentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankPaymentRequest" ADD CONSTRAINT "BankPaymentRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
