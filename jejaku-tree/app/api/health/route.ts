import { NextResponse } from "next/server";

// Deliberately doesn't touch the database — this answers "is the Next.js
// server itself up and serving requests", which is what Docker's
// healthcheck needs to distinguish a running container from a stuck one.
export function GET() {
  return NextResponse.json({ ok: true });
}
