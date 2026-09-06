import { NextResponse } from "next/server";
import { db } from "../db";
import { errorLogs } from "../db/schema";

// Best-effort: a logging failure (e.g. the DB connection that just threw
// the original error is also what this insert needs) must never replace
// or block the 500 response the caller is already returning.
async function logError(route: string, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  await db.insert(errorLogs).values({ route, message, stack }).catch(() => {});
}

// Wraps a route handler so an unexpected failure (DB connection drop, a
// query throwing, etc.) returns a clean 500 JSON response instead of
// Next's raw crash page — the routes' own explicit 400/401/404/409
// responses for expected, validated cases are unaffected since those
// return before ever throwing. Mirrors jejaku-receipt's identical wrapper.
//
// `route` (e.g. "POST /api/otp/request") is passed explicitly rather than
// derived from the request, since several call sites' handlers take no
// arguments at all — the caller already knows this string statically, so
// there's nothing to actually derive it from at the call site anyway.
export function withApiErrorHandling<Args extends unknown[]>(
  route: string,
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[api]", route, err);
      // Not awaited — the exact scenario this is most likely to fire in
      // (the DB itself is down or degraded) is also the scenario where
      // this insert could hang for a full connection-timeout before its
      // own .catch resolves. Awaiting it would mean a DB outage makes
      // every error response slower right when speed matters most; this
      // stays fire-and-forget so the 500 always returns immediately.
      void logError(route, err);
      return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
  };
}
