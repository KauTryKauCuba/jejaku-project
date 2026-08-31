export const RANGE_OPTIONS = ["This month", "3 months", "6 months", "12 months"];

export function monthsInRange(range: string) {
  return range === "This month" ? 1 : parseInt(range, 10);
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Oldest -> newest, current month last.
export function recentMonths(monthsShown: number, now: Date = new Date()) {
  return Array.from({ length: monthsShown }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsShown - 1 - i), 1);
    return { key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }) };
  });
}
