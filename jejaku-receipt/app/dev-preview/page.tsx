import { connection } from "next/server";
import { notFound } from "next/navigation";
import DevPreviewContent from "./DevPreviewContent";

// A scratch page for eyeballing a component in isolation against demo data
// — not linked from anywhere in the app, but a Next.js route is reachable
// by URL regardless of whether anything links to it. Was reachable in
// production (jejaku-receipt.jejaku.my/dev-preview) with no actual data
// exposed since it only ever renders DEMO_EXPENSES, but a dev tool has no
// business being live on the production domain at all. 404s outside
// development instead of being deleted, since it's still useful locally.
//
// connection() forces this out of static prerendering — without it, this
// page has no per-request data so Next.js prerenders it once at *build*
// time (NODE_ENV=production during `next build`), bakes the notFound()
// content into a static HTML file, and then serves that file with a plain
// 200 forever after, regardless of the runtime check. Confirmed against a
// real `next build` + standalone server: the response body was genuinely
// the 404 UI, but the status code was 200 until this was added.
export default async function DevPreviewPage() {
  await connection();
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <DevPreviewContent />;
}
