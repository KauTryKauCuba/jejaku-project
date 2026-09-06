import { NextResponse } from "next/server";

// Deliberately doesn't touch the database — this answers "is the Next.js
// server itself up and serving requests", which is what Docker's
// healthcheck needs to distinguish a running container from a stuck one.
// A DB-down situation should surface as its own failure elsewhere, not
// make this container get killed/restarted too.
export function GET() {
  return NextResponse.json({ ok: true });
}
