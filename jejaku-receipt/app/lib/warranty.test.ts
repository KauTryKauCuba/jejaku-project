import { describe, expect, it } from "vitest";
import {
  formatWarrantyStatus,
  warrantyClaimsFor,
  warrantyClaimStatuses,
  warrantyExpiryDate,
  warrantyStatus,
} from "./warranty";

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

describe("warrantyClaimsFor", () => {
  const base = { id: "e1", merchant: "Lazada", date: "2026-01-15" };

  it("returns nothing for a plain expense with no tags at all", () => {
    expect(warrantyClaimsFor(base)).toEqual([]);
  });

  it("returns one claim for a receipt-level tag when there are no items", () => {
    const claims = warrantyClaimsFor({ ...base, isWarrantyClaim: true, warrantyMonths: 12 });
    expect(claims).toEqual([
      { key: "e1:receipt", label: "Lazada", months: 12, expiry: warrantyExpiryDate("2026-01-15", 12) },
    ]);
  });

  it("returns one claim per tagged item, skipping untagged ones, when any item is tagged", () => {
    const claims = warrantyClaimsFor({
      ...base,
      items: [
        { id: "i1", name: "Kettle", isWarrantyClaim: true, warrantyMonths: 12 },
        { id: "i2", name: "Phone case" }, // never tagged
        { id: "i3", name: "USB cable", isWarrantyClaim: true }, // tagged, no length picked
      ],
    });
    expect(claims).toEqual([
      { key: "e1:i1", label: "Kettle", months: 12, expiry: warrantyExpiryDate("2026-01-15", 12) },
      { key: "e1:i3", label: "USB cable", months: undefined, expiry: undefined },
    ]);
  });

  it("ignores the receipt-level tag once any item carries its own — the two never combine into extra claims", () => {
    // Regression case for exactly the scenario this feature exists for: an
    // older itemized receipt that still has its whole-receipt flag set
    // from before item-level tagging existed, now with one item tagged.
    const claims = warrantyClaimsFor({
      ...base,
      isWarrantyClaim: true,
      warrantyMonths: 24,
      items: [{ id: "i1", name: "Kettle", isWarrantyClaim: true, warrantyMonths: 12 }],
    });
    expect(claims).toHaveLength(1);
    expect(claims[0]).toMatchObject({ label: "Kettle", months: 12 });
  });

  it("falls back to the receipt-level tag when items exist but none are tagged", () => {
    const claims = warrantyClaimsFor({
      ...base,
      isWarrantyClaim: true,
      warrantyMonths: 6,
      items: [{ id: "i1", name: "Phone case" }],
    });
    expect(claims).toEqual([
      { key: "e1:receipt", label: "Lazada", months: 6, expiry: warrantyExpiryDate("2026-01-15", 6) },
    ]);
  });

  it("falls back to the item's array position for a key when it has no id (pre-migration data)", () => {
    const claims = warrantyClaimsFor({ ...base, items: [{ name: "Kettle", isWarrantyClaim: true }] });
    expect(claims[0].key).toBe("e1:0");
  });
});

describe("warrantyClaimStatuses", () => {
  const now = new Date(2026, 8, 5); // 2026-09-05

  it("pairs each claim with its live status", () => {
    const result = warrantyClaimStatuses(
      {
        id: "e1",
        merchant: "Lazada",
        date: "2026-08-01",
        items: [
          { id: "i1", name: "Kettle", isWarrantyClaim: true, warrantyMonths: 1 }, // expires 2026-09-01, so expired by now
          { id: "i2", name: "Blender", isWarrantyClaim: true, warrantyMonths: 12 }, // active, far out
        ],
      },
      now
    );
    expect(result).toHaveLength(2);
    expect(result[0].claim.label).toBe("Kettle");
    expect(result[0].status.kind).toBe("expired");
    expect(result[1].claim.label).toBe("Blender");
    expect(result[1].status.kind).toBe("active");
  });

  it("is untracked for a tagged item with no coverage length, same as an untracked receipt", () => {
    const [{ status }] = warrantyClaimStatuses(
      { id: "e1", merchant: "Store", date: "2026-01-01", items: [{ id: "i1", name: "Thing", isWarrantyClaim: true }] },
      now
    );
    expect(status.kind).toBe("untracked");
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
