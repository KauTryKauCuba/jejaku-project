import { notFound } from "next/navigation";
import DevPreviewContent from "./DevPreviewContent";

// A scratch page for eyeballing a component in isolation against demo data
// — not linked from anywhere in the app, but a Next.js route is reachable
// by URL regardless of whether anything links to it. Was reachable in
// production (jejaku-receipt.jejaku.my/dev-preview) with no actual data
// exposed since it only ever renders DEMO_EXPENSES, but a dev tool has no
// business being live on the production domain at all. 404s outside
// development instead of being deleted, since it's still useful locally.
export default function DevPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <DevPreviewContent />;
}
