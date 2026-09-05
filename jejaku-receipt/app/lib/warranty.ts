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
  const expiry = new Date(y, m - 1, d);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
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

// The claim/coverage/expiry facts as exported data — deliberately not
// time-relative (unlike WarrantyStatus's daysLeft), since an export is a
// fixed record read at any later date, not a live screen. Shared by the
// CSV and PDF exports so "what counts as tracked coverage" can't quietly
// drift between the two the way it briefly did before this existed.
export type WarrantyExportFields = {
  isClaim: boolean;
  months: number | undefined;
  expiry: Date | undefined;
};

export function warrantyExportFields(expense: {
  isWarrantyClaim?: boolean;
  warrantyMonths?: number;
  date: string;
}): WarrantyExportFields {
  const isClaim = expense.isWarrantyClaim === true;
  const months = isClaim ? expense.warrantyMonths : undefined;
  const expiry = months !== undefined ? warrantyExpiryDate(expense.date, months) : undefined;
  return { isClaim, months, expiry };
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
