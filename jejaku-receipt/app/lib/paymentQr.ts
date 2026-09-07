export type PaymentQrCode = {
  id: string;
  label: string;
  url: string;
};

// A cap, not a technical limit — three covers the realistic case (say,
// bank transfer / Touch 'n Go / DuitNow) without Settings turning into an
// open-ended list to manage. Enforced server-side in the payment-qr route,
// not just hidden in the client once the limit is hit.
export const MAX_PAYMENT_QR_CODES = 3;
