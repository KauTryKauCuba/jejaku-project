// Warranty expiry is derived from the purchase date + coverage length, not
// stored as its own date — a second stored date could drift out of sync
// with either if one changed independently after the fact. `warrantyMonths`
// only means anything alongside `isWarrantyClaim`: a claim tagged before
// this field existed (or with an unknown coverage length) just has no
// expiry to derive, not an error.

const DAY_MS = 24 * 60 * 60 * 1000;

export type WarrantyStatus =
  | { kind: "untracked" }
  | { kind: "expired"; expiredOn: Date }
  | { kind: "active"; expiresOn: Date; daysLeft: number };

// A fixed, short menu rather than a free-typed number of months — the
// lengths that actually show up on receipts and warranty cards, so most
// taps land on an exact option instead of guessing "is 18 months a thing".
export const WARRANTY_LENGTH_OPTIONS: readonly { label: string; months: number }[] = [
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "1 year", months: 12 },
  { label: "2 years", months: 24 },
  { label: "3 years", months: 36 },
];

// `purchaseDate` is an expense's `date` field, YYYY-MM-DD — parsed as local
// midnight (not via `new Date(string)`, which reads a bare date as UTC) so
// adding months lands on the same calendar day regardless of the viewer's
// timezone.
export function warrantyExpiryDate(purchaseDate: string, months: number): Date {
  const [y, m, d] = purchaseDate.slice(0, 10).split("-").map(Number);
  const targetMonthIndex = m - 1 + months;
  // `Date`'s own month-overflow rollover doesn't clamp the day, so e.g.
  // Jan 31 + 1 month lands on Mar 3 (Feb only has 28/29 days) instead of
  // Feb 28 — clamp to the target month's actual last day ourselves.
  const daysInTargetMonth = new Date(y, targetMonthIndex + 1, 0).getDate();
  return new Date(y, targetMonthIndex, Math.min(d, daysInTargetMonth));
}

// `now` is injectable for tests; real callers always take the default.
export function warrantyStatus(
  expense: { isWarrantyClaim?: boolean; warrantyMonths?: number; date: string },
  now: Date = new Date()
): WarrantyStatus {
  if (!expense.isWarrantyClaim || !expense.warrantyMonths) return { kind: "untracked" };

  const expiresOn = warrantyExpiryDate(expense.date, expense.warrantyMonths);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((expiresOn.getTime() - today.getTime()) / DAY_MS);

  if (daysLeft < 0) return { kind: "expired", expiredOn: expiresOn };
  return { kind: "active", expiresOn, daysLeft };
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// A single warranty tag, resolved down to one flat list per receipt —
// either one entry per tagged item, or (only when no item is tagged) one
// entry for the whole receipt. `label` is what a list/tile/export shows
// for it: the item's own name for an item-level claim, the receipt's
// merchant for a receipt-level one.
export type WarrantyClaim = {
  key: string;
  label: string;
  months: number | undefined;
  expiry: Date | undefined;
};

// The one source of truth for "what counts as tracked warranty coverage"
// on a receipt — the dashboard tile, the receipts-list filter/badges, the
// CSV/PDF exports, and the Claim Kit all resolve claims through this
// function so none of them can quietly disagree with another about it.
//
// Item-level tags take priority over the receipt-level flag, and the two
// are never combined — a receipt with any tagged item is treated as fully
// itemized for warranty purposes, so the old whole-receipt tag (still
// settable in the form, e.g. for a receipt entered before its items were
// itemized) doesn't also produce a second, redundant claim once specific
// items carry their own. This also keeps every rollup (the dashboard tile,
// the expiring-soon bell, CSV/PDF exports) reading from one place instead
// of each having to re-decide which level wins.
export function warrantyClaimsFor(expense: {
  id: string;
  merchant: string;
  date: string;
  isWarrantyClaim?: boolean;
  warrantyMonths?: number;
  items?: { id?: string; name: string; isWarrantyClaim?: boolean; warrantyMonths?: number }[];
}): WarrantyClaim[] {
  const taggedItems = (expense.items ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.isWarrantyClaim);

  if (taggedItems.length > 0) {
    // `id` is only missing for an item saved before that field existed —
    // falls back to its position, which is at least stable for the
    // lifetime of a single render (good enough for a React list key; the
    // item picks up a real id the next time the expense is saved, via
    // normalizeItems).
    return taggedItems.map(({ item, index }) => {
      const expiry = item.warrantyMonths ? warrantyExpiryDate(expense.date, item.warrantyMonths) : undefined;
      return { key: `${expense.id}:${item.id ?? index}`, label: item.name, months: item.warrantyMonths, expiry };
    });
  }

  if (expense.isWarrantyClaim) {
    const expiry = expense.warrantyMonths ? warrantyExpiryDate(expense.date, expense.warrantyMonths) : undefined;
    return [{ key: `${expense.id}:receipt`, label: expense.merchant, months: expense.warrantyMonths, expiry }];
  }

  return [];
}

// Each claim's live status, alongside the claim itself — what the bell and
// the warranty-only filters actually need, since a claim with no coverage
// length is "untracked" the same way an untagged item is (nothing to
// count down to), not a third, different case.
export function warrantyClaimStatuses(
  expense: Parameters<typeof warrantyClaimsFor>[0],
  now: Date = new Date()
): { claim: WarrantyClaim; status: WarrantyStatus }[] {
  return warrantyClaimsFor(expense).map((claim) => ({
    claim,
    status: warrantyStatus({ isWarrantyClaim: true, warrantyMonths: claim.months, date: expense.date }, now),
  }));
}

// Short status label for a receipt row or tile — days close-in, weeks
// further out, months beyond that, so the number stays small and readable
// instead of "Expires in 187 days".
export function formatWarrantyStatus(status: WarrantyStatus): string | null {
  if (status.kind === "untracked") return null;
  if (status.kind === "expired") return `Expired ${isoDate(status.expiredOn)}`;

  const { daysLeft } = status;
  if (daysLeft === 0) return "Expires today";
  if (daysLeft < 14) return `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  if (daysLeft < 60) {
    const weeks = Math.round(daysLeft / 7);
    return `Expires in ${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const months = Math.round(daysLeft / 30);
  return `Expires in ${months} month${months === 1 ? "" : "s"}`;
}
