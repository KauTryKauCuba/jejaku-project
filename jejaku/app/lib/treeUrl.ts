export function treeUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_TREE_URL ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}
