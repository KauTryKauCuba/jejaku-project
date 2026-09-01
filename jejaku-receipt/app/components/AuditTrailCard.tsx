"use client";

import { useState } from "react";
import {
  ClockCounterClockwise,
  Plus,
  PencilSimple,
  Trash,
  WarningCircle,
  Tag,
  Sparkle,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { AUDIT_ACTIONS, AUDIT_LABELS, type AuditLogEntry } from "../lib/auditActions";
import Select from "./Select";

const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100"];

const ACTION_ICON: Record<string, typeof Plus> = {
  [AUDIT_ACTIONS.EXPENSE_CREATED]: Plus,
  [AUDIT_ACTIONS.EXPENSE_UPDATED]: PencilSimple,
  [AUDIT_ACTIONS.EXPENSE_DELETED]: Trash,
  [AUDIT_ACTIONS.EXPENSES_DELETED_ALL]: WarningCircle,
  [AUDIT_ACTIONS.CATEGORY_CREATED]: Tag,
  [AUDIT_ACTIONS.DEMO_SEEDED]: Sparkle,
  [AUDIT_ACTIONS.DEMO_REMOVED]: Sparkle,
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AuditTrailCard({ initialLogs }: { initialLogs: AuditLogEntry[] }) {
  const [page, setPage] = useState(0);
  const [pageSizeText, setPageSizeText] = useState(PAGE_SIZE_OPTIONS[0]);
  const pageSize = Number(pageSizeText);

  const pageCount = Math.max(1, Math.ceil(initialLogs.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageLogs = initialLogs.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-canvas p-[24px]">
      <div className="flex items-center gap-[8px]">
        <ClockCounterClockwise size={16} weight="light" className="text-ink-mute" />
        <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">
          Audit trail
        </h3>
      </div>
      <p className="mt-[8px] max-w-md text-[12px] leading-relaxed text-ink-mute">
        Every change made to your account — expenses, categories, and demo data — in one log.
      </p>

      {initialLogs.length === 0 ? (
        <p className="mt-[19px] text-[12px] text-ink-mute">
          Nothing logged yet — actions you take will show up here.
        </p>
      ) : (
        <ul className="mt-[15px] flex flex-col divide-y divide-hairline">
          {pageLogs.map((log) => {
            const Icon = ACTION_ICON[log.action] ?? ClockCounterClockwise;
            return (
              <li
                key={log.id}
                className="flex items-center gap-[11px] py-[11px] first:pt-0 last:pb-0"
              >
                <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-md bg-canvas-soft text-ink-mute">
                  <Icon size={14} weight="light" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">
                    {AUDIT_LABELS[log.action] ?? log.action}
                  </p>
                  {log.detail && (
                    <p className="truncate text-[11px] text-ink-mute">{log.detail}</p>
                  )}
                </div>
                <span className="tabular shrink-0 text-[11px] text-ink-mute">
                  {formatTimestamp(log.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {initialLogs.length > 0 && (
        <div className="mt-[15px] flex flex-wrap items-center justify-between gap-y-[8px] border-t border-hairline pt-[11px]">
          <div className="flex items-center gap-[8px] text-[12px] text-ink-mute">
            Show
            <div className="w-[68px]">
              <Select
                value={pageSizeText}
                options={PAGE_SIZE_OPTIONS}
                onChange={(value) => {
                  setPageSizeText(value);
                  setPage(0);
                }}
              />
            </div>
            per page
          </div>

          {pageCount > 1 && (
            <div className="flex items-center gap-[11px]">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous page"
                className="flex h-[28px] w-[28px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-40 disabled:hover:bg-canvas"
              >
                <CaretLeft size={13} weight="bold" />
              </button>
              <p className="text-[12px] text-ink-mute">
                Page {currentPage + 1} of {pageCount}
              </p>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage === pageCount - 1}
                aria-label="Next page"
                className="flex h-[28px] w-[28px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-40 disabled:hover:bg-canvas"
              >
                <CaretRight size={13} weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
