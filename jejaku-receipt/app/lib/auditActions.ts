// Client-safe constants and types for audit log entries — no server-only
// imports (db client), so this can be imported from a "use client"
// component that renders the log. Actual writes live in auditLog.ts.
export const AUDIT_ACTIONS = {
  EXPENSE_CREATED: "expense.created",
  EXPENSE_UPDATED: "expense.updated",
  EXPENSE_DELETED: "expense.deleted",
  EXPENSES_DELETED_ALL: "expenses.deleted_all",
  CATEGORY_CREATED: "category.created",
  DEMO_SEEDED: "demo.seeded",
  DEMO_REMOVED: "demo.removed",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_LABELS: Record<string, string> = {
  [AUDIT_ACTIONS.EXPENSE_CREATED]: "Expense added",
  [AUDIT_ACTIONS.EXPENSE_UPDATED]: "Expense edited",
  [AUDIT_ACTIONS.EXPENSE_DELETED]: "Expense deleted",
  [AUDIT_ACTIONS.EXPENSES_DELETED_ALL]: "All expenses deleted",
  [AUDIT_ACTIONS.CATEGORY_CREATED]: "Category added",
  [AUDIT_ACTIONS.DEMO_SEEDED]: "Demo data loaded",
  [AUDIT_ACTIONS.DEMO_REMOVED]: "Demo data removed",
};

export type AuditLogEntry = {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
};
