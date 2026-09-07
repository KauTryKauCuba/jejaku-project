import { NextResponse } from "next/server";

// /dev-preview is a local-only scratch page (see app/dev-preview/page.tsx)
// — this is the layer that actually enforces that outside production, not
// the page component's own notFound() check alone. Same reasoning as
// jejaku-receipt's copy of this file: a plain page-level notFound() can't
// reliably produce a real 404 status once streaming has started, so this
// runs before any rendering begins instead.
export function proxy() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/dev-preview",
};
