import { connection } from "next/server";
import { notFound } from "next/navigation";
import DevPreviewContent from "./DevPreviewContent";

// A scratch page for eyeballing a component in isolation — same pattern
// as jejaku-receipt's copy of this file, see there for the full
// rationale (why connection() is needed, why proxy.ts also guards this
// route). 404s outside development instead of being deleted, since it's
// still useful locally.
export default async function DevPreviewPage() {
  await connection();
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <DevPreviewContent />;
}
