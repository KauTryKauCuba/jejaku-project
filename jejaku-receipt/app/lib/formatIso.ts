// ISO 8601 display formatting (local wall-clock, zero-padded, year-first) —
// used everywhere a date/time is shown to the user, so every surface in the
// app reads the same way instead of mixing locale strings and ISO.
function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatIsoTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatIsoDateTime(date: Date) {
  return `${formatIsoDate(date)}T${formatIsoTime(date)}`;
}

// Minute precision, no seconds — for tight layouts (cards, badges) where
// full-second precision isn't needed but the value must still stay ISO 8601.
export function formatIsoMinute(date: Date) {
  return `${formatIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
