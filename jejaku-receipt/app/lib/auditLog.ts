import { db } from "../db";
import { auditLogs } from "../db/schema";
import { AUDIT_ACTIONS, type AuditAction } from "./auditActions";

export { AUDIT_ACTIONS };
export type { AuditAction };

// Fire-and-forget by design at call sites — a failed audit-log write is a
// bookkeeping miss, not a reason to fail the actual action (saving an
// expense, deleting a category, etc.) that triggered it.
export async function logAudit(userId: string, action: AuditAction, detail?: string) {
  try {
    await db.insert(auditLogs).values({ userId, action, detail: detail ?? null });
  } catch (err) {
    console.error("[auditLog] failed to write entry", action, err);
  }
}
