import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { unlink } from "fs/promises";
import path from "path";
import { getCurrentUser } from "../../../lib/currentUser";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { QR_UPLOADS_DIR, saveQrPhoto } from "../../../lib/uploads";
import { withApiErrorHandling } from "../../../lib/apiError";
import { MAX_PAYMENT_QR_CODES } from "../../../lib/paymentQr";

// Adds one QR code (up to MAX_PAYMENT_QR_CODES) — never replaces the
// existing list, unlike the old single-QR version of this route. Settings
// removes a slot explicitly (DELETE below) before adding a replacement.
export const POST = withApiErrorHandling("POST /api/users/payment-qr", async (request: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (user.paymentQrCodes.length >= MAX_PAYMENT_QR_CODES) {
    return NextResponse.json({ error: `You can save up to ${MAX_PAYMENT_QR_CODES} QR codes.` }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  const rawLabel = formData.get("label");
  const label = typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim().slice(0, 40) : `QR ${user.paymentQrCodes.length + 1}`;

  let url: string;
  try {
    url = await saveQrPhoto(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't save that image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const paymentQrCodes = [...user.paymentQrCodes, { id: randomUUID(), label, url }];
  await db.update(users).set({ paymentQrCodes }).where(eq(users.id, user.id));

  return NextResponse.json({ paymentQrCodes });
});

export const DELETE = withApiErrorHandling("DELETE /api/users/payment-qr", async (request: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const removed = user.paymentQrCodes.find((qr) => qr.id === id);
  const paymentQrCodes = user.paymentQrCodes.filter((qr) => qr.id !== id);
  await db.update(users).set({ paymentQrCodes }).where(eq(users.id, user.id));

  // Same cleanup pattern as expense photo deletion (app/api/expenses/[id]/
  // route.ts) — a failed unlink (already missing, permissions) shouldn't
  // surface as an error, since the DB reference is already gone either way.
  if (removed) {
    await unlink(path.join(QR_UPLOADS_DIR, path.basename(removed.url))).catch(() => {});
  }

  return NextResponse.json({ paymentQrCodes });
});
