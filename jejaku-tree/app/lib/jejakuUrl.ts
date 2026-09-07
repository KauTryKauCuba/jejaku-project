export function jejakuUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_JEJAKU_URL ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}
