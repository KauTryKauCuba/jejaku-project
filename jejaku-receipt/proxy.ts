import { NextResponse } from "next/server";

// /dev-preview is a local-only scratch page (see app/dev-preview/page.tsx)
// — this is the layer that actually enforces that outside production, not
// the page component's own notFound() check alone. A plain page-level
// notFound() can't reliably produce a real 404 status here: the root
// app/loading.tsx wraps every route in an implicit Suspense boundary, so
// the shell starts streaming as a 200 before the page component's own
// check ever runs, and the status can't change retroactively once
// streaming has started (confirmed against a real `next build` +
// standalone production server — the response body was genuinely the
// notFound() UI, but the status code stayed 200). Proxy runs before any
// rendering/streaming begins, so it can set a real 404 here reliably.
// The page's own check stays in place too, as a second layer in case this
// matcher config is ever changed without noticing.
export function proxy() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/dev-preview",
};
