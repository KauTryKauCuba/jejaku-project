"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Tray, Camera, CaretLeft, CaretRight, CaretDown, PencilSimple, Trash, Check, X, Shield, Users, MagnifyingGlass, FileCsv, FilePdf } from "@phosphor-icons/react";
import { formatCurrency, type Expense } from "../lib/expenses";
import { withWeekday } from "../lib/formatIso";
import { formatWarrantyStatus, warrantyStatus } from "../lib/warranty";
import { expensesToCsv, downloadCsv } from "../lib/exportCsv";
import { downloadPdf } from "../lib/exportPdf";
import { useCategories, useDeleteExpense, useExpenses, useUpdateExpense } from "./ExpensesProvider";
import { useDismissable } from "../lib/useDismissable";
import Select from "./Select";
import DatePicker from "./DatePicker";
import Modal from "./Modal";
import ExpenseForm from "./ExpenseForm";
import SplitBillModal from "./SplitBillModal";

const PAGE_SIZE_OPTIONS = ["5", "10", "50", "100"];
const ALL_CATEGORIES = "All categories";


export default function ReceiptsList({
  title,
  description,
  defaultPageSize = "5",
  editable = false,
  filterable = false,
}: {
  title: string;
  description: string;
  defaultPageSize?: string;
  /** Shows per-row edit/delete controls. Off by default so the dashboard's
   * compact Recent Receipts card stays read-only — only the full /receipts
   * page opts in. */
  editable?: boolean;
  /** Shows the merchant search / category / date-range filter bar and a CSV
   * export button. Off by default for the same reason as `editable` — the
   * dashboard's compact card has too few rows for filtering to earn its
   * space, only the full /receipts page opts in. */
  filterable?: boolean;
}) {
  const expenses = useExpenses();
  const categories = useCategories();
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useDismissable(exportMenuOpen, exportMenuRef, useCallback(() => setExportMenuOpen(false), []));

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

  // Newest receipt date first, not insertion order — `expenses` arrives
  // sorted by createdAt (when it was scanned/entered), which drifts from
  // the receipt's own date the moment someone backfills an older purchase
  // or seeds demo data out of date order. Ties (rare: same day) fall back
  // to createdAt so same-day receipts still land most-recently-added-first.
  const sortedExpenses = useMemo(
    () =>
      [...expenses].sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return a.createdAt < b.createdAt ? 1 : -1;
      }),
    [expenses]
  );

  const hasWarrantyClaims = expenses.some((e) => e.isWarrantyClaim);
  const trimmedSearch = search.trim().toLowerCase();
  const hasActiveFilters =
    filterable && (trimmedSearch !== "" || categoryFilter !== ALL_CATEGORIES || dateFrom !== "" || dateTo !== "");
  const visibleExpenses = sortedExpenses.filter((e) => {
    if (warrantyOnly && !e.isWarrantyClaim) return false;
    if (!filterable) return true;
    if (trimmedSearch) {
      const matchesMerchant = e.merchant.toLowerCase().includes(trimmedSearch);
      const matchesItem = e.items?.some((item) => item.name.toLowerCase().includes(trimmedSearch)) ?? false;
      if (!matchesMerchant && !matchesItem) return false;
    }
    if (categoryFilter !== ALL_CATEGORIES && e.category !== categoryFilter) return false;
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });

  const exportBaseName = `jejaku-receipt-export-${new Date().toISOString().slice(0, 10)}`;

  const handleExportCsv = () => {
    setExportMenuOpen(false);
    downloadCsv(`${exportBaseName}.csv`, expensesToCsv(visibleExpenses));
  };

  const handleExportPdf = () => {
    setExportMenuOpen(false);
    downloadPdf(`${exportBaseName}.pdf`, visibleExpenses);
  };

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
        <div className="flex shrink-0 items-center gap-[8px]">
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
          {filterable && visibleExpenses.length > 0 && (
            <div ref={exportMenuRef} className="relative shrink-0">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
                onClick={() => setExportMenuOpen((v) => !v)}
                className="flex h-[33px] items-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[13px] text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
              >
                Export
                <CaretDown size={11} weight="bold" />
              </button>
              {exportMenuOpen && (
                <ul
                  role="menu"
                  className="absolute right-0 top-[calc(100%+4px)] z-20 w-[160px] overflow-hidden rounded-sm border border-hairline bg-canvas py-[4px] shadow-lg"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleExportCsv}
                      className="flex w-full items-center gap-[8px] px-[11px] py-[8px] text-left text-[13px] text-ink transition-colors hover:bg-canvas-soft"
                    >
                      <FileCsv size={14} weight="light" />
                      Export as CSV
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleExportPdf}
                      className="flex w-full items-center gap-[8px] px-[11px] py-[8px] text-left text-[13px] text-ink transition-colors hover:bg-canvas-soft"
                    >
                      <FilePdf size={14} weight="light" />
                      Export as PDF
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {filterable && (
        <div className="mt-[15px] grid grid-cols-2 gap-[8px] sm:grid-cols-4">
          <div className="relative col-span-2 sm:col-span-1">
            <MagnifyingGlass
              size={13}
              weight="light"
              className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-ink-mute"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search merchant or item"
              className="h-[37px] w-full rounded-sm border border-hairline-input bg-canvas pl-[29px] pr-[11px] text-[14px] text-ink outline-none transition-colors focus:border-primary"
            />
          </div>
          <Select
            value={categoryFilter}
            options={[ALL_CATEGORIES, ...categories]}
            onChange={(value) => {
              setCategoryFilter(value);
              setPage(0);
            }}
          />
          <DatePicker
            value={dateFrom}
            placeholder="From date"
            onChange={(value) => {
              setDateFrom(value);
              setPage(0);
            }}
          />
          <DatePicker
            value={dateTo}
            placeholder="To date"
            onChange={(value) => {
              setDateTo(value);
              setPage(0);
            }}
          />
        </div>
      )}

      {visibleExpenses.length === 0 ? (
        <div className="mt-[19px] flex flex-col items-center rounded-md bg-canvas-soft px-[15px] py-[38px] text-center">
          <Tray size={22} weight="light" className="text-ink-mute" />
          <p className="mt-[11px] text-[13px] font-medium text-ink">
            {hasActiveFilters
              ? "No receipts match"
              : warrantyOnly
                ? "No warranty claims tagged"
                : "No receipts yet"}
          </p>
          <p className="mt-[4px] max-w-[26ch] text-[12px] leading-relaxed text-ink-mute">
            {hasActiveFilters
              ? "Try a different search, category, or date range."
              : warrantyOnly
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
                    {e.category} · {withWeekday(e.date)} · <span className="tabular">{receiptNumber(e.id)}</span>
                    {e.split && e.split.people.length > 0 && ` · Split ${e.split.people.length} ways`}
                    {(() => {
                      const status = warrantyStatus(e);
                      const label = formatWarrantyStatus(status);
                      if (!label) return null;
                      return (
                        <>
                          {" · "}
                          <span className={status.kind === "expired" ? "text-error" : undefined}>{label}</span>
                        </>
                      );
                    })()}
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
            initialWarrantyMonths={editing.warrantyMonths}
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
