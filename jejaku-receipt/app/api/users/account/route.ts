import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { verifyDeleteToken } from "../../../lib/deleteToken";
import { UPLOADS_DIR } from "../../../lib/uploads";
import { db } from "../../../db";
import { expenses, users } from "../../../db/schema";

// Called cross-origin from jejaku's /settings page, same as
// users/currency — the shared session cookie (domain .jejaku.my) already
// authenticates the request; this only adds the CORS headers needed for a
// browser to let that credentialed fetch through. Scoped to jejaku's exact
// origin, not a wildcard, since wildcard + credentials is rejected by
// browsers anyway.
const ALLOWED_ORIGIN = (process.env.NEXT_PUBLIC_JEJAKU_URL ?? "").replace(/\/+$/, "");

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Delete-Token",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  const email = session?.dbProfile?.email ?? session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: corsHeaders() });
  }

  // Proves an OTP code was verified on jejaku for this specific email
  // within the last few minutes (see lib/deleteToken.ts, signed with the
  // AUTH_SECRET both apps already share) — checked here rather than
  // trusted from the client's own gating, so a stolen/replayed session
  // cookie alone can't wipe this account's data without ever seeing the
  // emailed code.
  const token = request.headers.get("x-delete-token");
  if (!token || !verifyDeleteToken(token, email)) {
    return NextResponse.json({ error: "Verification required." }, { status: 403, headers: corsHeaders() });
  }

  try {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      // Already deleted — e.g. a retry after jejaku's own delete call
      // failed on a first attempt. The desired end state (no data here for
      // this account) already holds, so this is success, not a 401 — an
      // idempotent DELETE means a transient failure downstream can be
      // retried instead of leaving the account permanently stuck (every
      // retry re-runs this call first, and it would otherwise fail here
      // forever on an account already gone from this side).
      return NextResponse.json({ ok: true }, { headers: corsHeaders() });
    }

    // Grab photo paths before the cascading delete removes the expense
    // rows that reference them — the cascade only cleans up Postgres, not
    // the files those rows pointed at.
    const userExpenses = await db.query.expenses.findMany({
      where: eq(expenses.userId, user.id),
      columns: { photoUrl: true },
    });

    // `expenses` and `audit_logs` both declare onDelete: "cascade" on
    // user_id, so this one delete removes every row this account owns.
    await db.delete(users).where(eq(users.id, user.id));

    // Best-effort — the DB rows are already gone either way, so a failed
    // unlink (already missing, permissions) shouldn't surface as an error.
    await Promise.all(
      userExpenses
        .filter((row): row is { photoUrl: string } => typeof row.photoUrl === "string")
        .map((row) => unlink(path.join(UPLOADS_DIR, path.basename(row.photoUrl))).catch(() => {}))
    );

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } catch (err) {
    console.error("[api]", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500, headers: corsHeaders() });
  }
}
