// ISO 8601 display formatting (local wall-clock, zero-padded, year-first) —
// used everywhere a date/time is shown to the user, so every surface in the
// app reads the same way instead of mixing locale strings and ISO.
function pad(n: number) {
  return String(n).padStart(2, "0");
}

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatIsoTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatIsoDateTime(date: Date) {
  return `${WEEKDAY_ABBR[date.getDay()]}, ${formatIsoDate(date)}T${formatIsoTime(date)}`;
}

// Minute precision, no seconds — for tight layouts (cards, badges) where
// full-second precision isn't needed but the value must still stay ISO 8601.
export function formatIsoMinute(date: Date) {
  return `${WEEKDAY_ABBR[date.getDay()]}, ${formatIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Prepends the weekday abbreviation to an already-ISO date/datetime string
// (e.g. "2026-09-04" -> "Fri, 2026-09-04") — for the (rarer here) cases
// where a raw ISO string is displayed directly rather than built from a
// Date via the functions above. Parses the date portion as local time, not
// UTC, so the weekday matches the calendar day actually shown.
export function withWeekday(isoDateOrDateTime: string) {
  const [y, m, d] = isoDateOrDateTime.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAY_ABBR[date.getDay()]}, ${isoDateOrDateTime}`;
}
