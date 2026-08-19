import type { Prisma } from "@/generated/prisma/client";

export function auditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    adminId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
    reason?: string | null;
  }
) {
  return tx.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeJson: input.beforeJson,
      afterJson: input.afterJson,
      reason: input.reason ?? null
    }
  });
}
