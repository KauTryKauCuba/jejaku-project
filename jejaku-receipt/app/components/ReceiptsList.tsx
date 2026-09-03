"use client";

import { useMemo, useState } from "react";
import { Tray, Camera, CaretLeft, CaretRight, PencilSimple, Trash, Check, X, Shield, Users } from "@phosphor-icons/react";
import { formatCurrency, type Expense } from "../lib/expenses";
import { useDeleteExpense, useExpenses, useUpdateExpense } from "./ExpensesProvider";
import Select from "./Select";
import Modal from "./Modal";
import ExpenseForm from "./ExpenseForm";
import SplitBillModal from "./SplitBillModal";

const PAGE_SIZE_OPTIONS = ["5", "10", "50", "100"];


export default function ReceiptsList({
  title,
  description,
  defaultPageSize = "5",
  editable = false,
}: {
  title: string;
  description: string;
  defaultPageSize?: string;
  /** Shows per-row edit/delete controls. Off by default so the dashboard's
   * compact Recent Receipts card stays read-only — only the full /receipts
   * page opts in. */
  editable?: boolean;
}) {
  const expenses = useExpenses();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const [page, setPage] = useState(0);
  const [pageSizeText, setPageSizeText] = useState(defaultPageSize);
  const pageSize = Number(pageSizeText);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [splitting, setSplitting] = useState<Expense | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [warrantyOnly, setWarrantyOnly] = useState(false);

  // A short, memorable per-account receipt number (#0001, #0002, ...) in
  // the order each receipt was added — the UUID primary key stays the
  // real identifier underneath, this is purely a display label. Derived
  // from the full unfiltered list so numbers stay stable across paging
  // and the warranty-only filter, not recomputed per page.
  const receiptNumbers = useMemo(() => {
    const chronological = [...expenses].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    const numbers = new Map<string, number>();
    chronological.forEach((e, i) => numbers.set(e.id, i + 1));
    return numbers;
  }, [expenses]);
  const receiptNumber = (id: string) => `#${String(receiptNumbers.get(id) ?? 0).padStart(4, "0")}`;

  const hasWarrantyClaims = expenses.some((e) => e.isWarrantyClaim);
  const visibleExpenses = warrantyOnly ? expenses.filter((e) => e.isWarrantyClaim) : expenses;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
    } catch {
      // Deletion is a simple, low-stakes action — leave the row in place
      // and let the user retry rather than showing a persistent error.
    } finally {
      setDeletingId(null);
      setConfirmingDeleteId(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(visibleExpenses.length / pageSize));
  // Clamp rather than reset via effect — new expenses can only prepend
  // (shifting items later, never removing the current page), so this
  // only ever matters if the list shrinks or the page size grows.
  const currentPage = Math.min(page, pageCount - 1);
  const pageExpenses = visibleExpenses.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-canvas p-[20px]">
      <div className="flex flex-wrap items-start justify-between gap-[8px]">
        <div>
          <h3 className="text-[15px] font-light tracking-[-0.19px] text-ink">{title}</h3>
          <p className="mt-[4px] text-[12px] text-ink-mute">{description}</p>
        </div>
        {hasWarrantyClaims && (
          <button
            type="button"
            onClick={() => {
              setWarrantyOnly((v) => !v);
              setPage(0);
            }}
            aria-pressed={warrantyOnly}
            className={
              warrantyOnly
                ? "flex h-[33px] shrink-0 items-center gap-[6px] rounded-pill bg-primary px-[13px] text-[13px] font-medium text-on-primary transition-colors"
                : "flex h-[33px] shrink-0 items-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[13px] text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
            }
          >
            <Shield size={13} weight={warrantyOnly ? "fill" : "light"} />
            Warranty claims
          </button>
        )}
      </div>

      {visibleExpenses.length === 0 ? (
        <div className="mt-[19px] flex flex-col items-center rounded-md bg-canvas-soft px-[15px] py-[38px] text-center">
          <Tray size={22} weight="light" className="text-ink-mute" />
          <p className="mt-[11px] text-[13px] font-medium text-ink">
            {warrantyOnly ? "No warranty claims tagged" : "No receipts yet"}
          </p>
          <p className="mt-[4px] max-w-[26ch] text-[12px] leading-relaxed text-ink-mute">
            {warrantyOnly
              ? "Tag a receipt as a warranty claim from its edit screen and it'll show up here."
              : "Scan a receipt above and it'll show up here."}
          </p>
        </div>
      ) : (
        <ul className="mt-[15px] flex flex-col divide-y divide-hairline">
          {pageExpenses.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-[11px] py-[11px] first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-1 items-center gap-[11px]">
                <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-canvas-soft text-ink-mute">
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Camera size={14} weight="light" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-[5px] text-[13px] font-medium text-ink">
                    <span className="truncate">{e.merchant}</span>
                    {e.isWarrantyClaim && (
                      <Shield
                        size={12}
                        weight="fill"
                        className="shrink-0 text-primary"
                        aria-label="Warranty claim"
                      />
                    )}
                    {e.split && e.split.people.length > 0 && (
                      <Users
                        size={12}
                        weight="fill"
                        className="shrink-0 text-primary"
                        aria-label={`Split ${e.split.people.length} ways`}
                      />
                    )}
                  </p>
                  <p className="text-[11px] text-ink-mute">
                    {e.category} · {e.date} · <span className="tabular">{receiptNumber(e.id)}</span>
                    {e.split && e.split.people.length > 0 && ` · Split ${e.split.people.length} ways`}
                  </p>
                </div>
              </div>
              <p className="tabular shrink-0 text-[13px] font-medium text-ink">
                {formatCurrency(e.amount, e.currency)}
              </p>

              {editable && (confirmingDeleteId === e.id ? (
                <div className="flex shrink-0 items-center gap-[6px]">
                  <span className="text-[11px] text-ink-mute">Delete?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    disabled={deletingId === e.id}
                    aria-label="Confirm delete"
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-error transition-colors hover:bg-canvas-soft disabled:opacity-50"
                  >
                    <Check size={13} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(null)}
                    disabled={deletingId === e.id}
                    aria-label="Cancel delete"
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft disabled:opacity-50"
                  >
                    <X size={13} weight="light" />
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-[6px]">
                  <button
                    type="button"
                    onClick={() => setSplitting(e)}
                    aria-label={`Split ${e.merchant}`}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
                  >
                    <Users size={13} weight="light" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditError(undefined);
                      setEditing(e);
                    }}
                    aria-label={`Edit ${e.merchant}`}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
                  >
                    <PencilSimple size={13} weight="light" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(e.id)}
                    aria-label={`Delete ${e.merchant}`}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
                  >
                    <Trash size={13} weight="light" />
                  </button>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}

      {visibleExpenses.length > 0 && (
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

      {editing && (
        <Modal title="Edit expense" onClose={() => setEditing(null)}>
          <p className="mb-[11px] tabular text-[11px] text-ink-mute">{receiptNumber(editing.id)}</p>
          {editError && <p className="mb-[8px] text-[12px] text-error">{editError}</p>}
          <ExpenseForm
            disabled={savingEdit}
            initialMerchant={editing.merchant}
            initialAmount={editing.amount}
            initialDate={editing.date}
            initialCategory={editing.category}
            initialCity={editing.city}
            initialState={editing.state}
            initialCountry={editing.country}
            initialItems={editing.items}
            initialSplit={editing.split}
            initialCurrency={editing.currency}
            initialTax={editing.tax}
            initialWarrantyClaim={editing.isWarrantyClaim}
            onCancel={() => setEditing(null)}
            onSubmit={async (data) => {
              setSavingEdit(true);
              setEditError(undefined);
              try {
                await updateExpense(editing.id, data);
                setEditing(null);
              } catch {
                setEditError("Couldn't save changes. Try again.");
              } finally {
                setSavingEdit(false);
              }
            }}
          />
        </Modal>
      )}

      {splitting && <SplitBillModal expense={splitting} onClose={() => setSplitting(null)} />}
    </div>
  );
}
