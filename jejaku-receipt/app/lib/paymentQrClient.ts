import type { PaymentQrCode } from "./paymentQr";

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  return new File([array], filename, { type: mime });
}

// Shared by PaymentQrCard (Settings) and ShareSplitModal — a QR uploaded
// from either place is saved to the account the same way, so it shows up
// in both without a page reload: Settings gets it back on its next visit,
// ShareSplitModal via ExpensesProvider's addPaymentQrCode updating its
// in-memory list immediately.
export async function savePaymentQrCode(croppedDataUrl: string, label?: string): Promise<PaymentQrCode[]> {
  const form = new FormData();
  form.set("file", dataUrlToFile(croppedDataUrl, "payment-qr.png"));
  if (label?.trim()) form.set("label", label.trim());
  const res = await fetch("/api/users/payment-qr", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Couldn't save QR code.");
  }
  const { paymentQrCodes } = (await res.json()) as { paymentQrCodes: PaymentQrCode[] };
  return paymentQrCodes;
}
