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
// return before ever throwing. Same copy as jejaku-receipt's version of
// this file.
export function withApiErrorHandling<Args extends unknown[]>(
  route: string,
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[api]", route, err);
      void logError(route, err);
      return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
  };
}
