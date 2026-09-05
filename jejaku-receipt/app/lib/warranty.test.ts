import { describe, expect, it } from "vitest";
import { formatWarrantyStatus, warrantyExpiryDate, warrantyExportFields, warrantyStatus } from "./warranty";

describe("warrantyExpiryDate", () => {
  it("adds the given number of months to the purchase date", () => {
    const expiry = warrantyExpiryDate("2026-01-15", 6);
    expect(expiry.getFullYear()).toBe(2026);
    expect(expiry.getMonth()).toBe(6); // July, 0-indexed
    expect(expiry.getDate()).toBe(15);
  });

  it("rolls over into the next year", () => {
    const expiry = warrantyExpiryDate("2026-09-05", 12);
    expect(expiry.getFullYear()).toBe(2027);
    expect(expiry.getMonth()).toBe(8); // September
    expect(expiry.getDate()).toBe(5);
  });

  it("clamps to the target month's last day instead of overflowing into the next one", () => {
    // A regression test: `Date.setMonth` doesn't clamp, so Jan 31 + 1
    // month used to land on Mar 3 (Feb only has 28 days in 2026) instead
    // of the intended Feb 28.
    const expiry = warrantyExpiryDate("2026-01-31", 1);
    expect(expiry.getFullYear()).toBe(2026);
    expect(expiry.getMonth()).toBe(1); // February
    expect(expiry.getDate()).toBe(28);
  });

  it("clamps to Feb 29 in a leap year", () => {
    const expiry = warrantyExpiryDate("2023-08-29", 6);
    expect(expiry.getFullYear()).toBe(2024);
    expect(expiry.getMonth()).toBe(1); // February
    expect(expiry.getDate()).toBe(29); // 2024 is a leap year
  });
});

describe("warrantyStatus", () => {
  const now = new Date(2026, 8, 5); // 2026-09-05, local midnight

  it("is untracked when the expense isn't a warranty claim", () => {
    expect(warrantyStatus({ isWarrantyClaim: false, warrantyMonths: 12, date: "2026-01-01" }, now)).toEqual({
      kind: "untracked",
    });
  });

  it("is untracked when tagged but no coverage length was set", () => {
    expect(warrantyStatus({ isWarrantyClaim: true, date: "2026-01-01" }, now)).toEqual({ kind: "untracked" });
  });

  it("is active with days remaining before the expiry date", () => {
    const status = warrantyStatus({ isWarrantyClaim: true, warrantyMonths: 1, date: "2026-09-01" }, now);
    expect(status.kind).toBe("active");
    if (status.kind === "active") expect(status.daysLeft).toBe(26); // 2026-10-01 minus 2026-09-05
  });

  it("is expired once the expiry date has passed", () => {
    const status = warrantyStatus({ isWarrantyClaim: true, warrantyMonths: 1, date: "2026-01-01" }, now);
    expect(status.kind).toBe("expired");
  });

  it("is active on the expiry day itself (0 days left)", () => {
    const status = warrantyStatus({ isWarrantyClaim: true, warrantyMonths: 1, date: "2026-08-05" }, now);
    expect(status).toEqual(expect.objectContaining({ kind: "active", daysLeft: 0 }));
  });
});

describe("warrantyExportFields", () => {
  // Shared by the CSV and PDF exports — this is the one source of truth
  // for "what counts as tracked coverage" so the two can't quietly
  // disagree on it, which is exactly what happened before this existed.

  it("is not a claim when isWarrantyClaim is false, even with warrantyMonths set", () => {
    expect(warrantyExportFields({ isWarrantyClaim: false, warrantyMonths: 12, date: "2026-01-01" })).toEqual({
      isClaim: false,
      months: undefined,
      expiry: undefined,
    });
  });

  it("is a claim with no coverage when tagged but no length was picked", () => {
    const result = warrantyExportFields({ isWarrantyClaim: true, date: "2026-01-01" });
    expect(result.isClaim).toBe(true);
    expect(result.months).toBeUndefined();
    expect(result.expiry).toBeUndefined();
  });

  it("derives an expiry date when both the claim flag and coverage length are set", () => {
    const result = warrantyExportFields({ isWarrantyClaim: true, warrantyMonths: 6, date: "2026-01-15" });
    expect(result.isClaim).toBe(true);
    expect(result.months).toBe(6);
    expect(result.expiry).toEqual(warrantyExpiryDate("2026-01-15", 6));
  });
});

describe("formatWarrantyStatus", () => {
  it("returns null for an untracked warranty", () => {
    expect(formatWarrantyStatus({ kind: "untracked" })).toBeNull();
  });

  it("labels an expired warranty with its expiry date", () => {
    expect(formatWarrantyStatus({ kind: "expired", expiredOn: new Date(2026, 0, 15) })).toBe("Expired 2026-01-15");
  });

  it("says 'today' at zero days left", () => {
    expect(formatWarrantyStatus({ kind: "active", expiresOn: new Date(), daysLeft: 0 })).toBe("Expires today");
  });

  it("counts in days when close in", () => {
    expect(formatWarrantyStatus({ kind: "active", expiresOn: new Date(), daysLeft: 5 })).toBe("Expires in 5 days");
  });

  it("counts in weeks in the middle range", () => {
    expect(formatWarrantyStatus({ kind: "active", expiresOn: new Date(), daysLeft: 42 })).toBe("Expires in 6 weeks");
  });

  it("counts in months further out", () => {
    expect(formatWarrantyStatus({ kind: "active", expiresOn: new Date(), daysLeft: 90 })).toBe("Expires in 3 months");
  });
});
