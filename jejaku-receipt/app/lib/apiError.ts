import { NextResponse } from "next/server";

// Wraps a route handler so an unexpected failure (DB connection drop, a
// query throwing, etc.) returns a clean 500 JSON response instead of
// Next's raw crash page — the routes' own explicit 400/401/404/409
// responses for expected, validated cases are unaffected since those
// return before ever throwing.
export function withApiErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[api]", err);
      return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
  };
}
