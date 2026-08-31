export function receiptUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_RECEIPT_URL ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}
