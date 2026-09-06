import { Resend } from "resend";

const FROM_EMAIL = process.env.OTP_FROM_EMAIL ?? "otp@jejaku.my";
const SITE_URL = process.env.NEXT_PUBLIC_JEJAKU_URL ?? "https://jejaku.my";

export type OtpPurpose = "sign-in" | "delete-account";

// Same underlying OTP mechanism either way (one otp_codes table, one
// verify path) — only the wording changes, so someone requesting a code
// to delete their account doesn't get an email that describes it as a
// "sign-in code" (confusing at best), and someone who *didn't* request
// it gets a warning proportional to what the code actually authorizes —
// "ignore this" is fine for a routine sign-in, not for account deletion.
const OTP_COPY: Record<
  OtpPurpose,
  { subjectLabel: string; leadIn: string; disclaimer: string }
> = {
  "sign-in": {
    subjectLabel: "is your Jejaku code",
    leadIn: "Your sign-in code is",
    disclaimer: "If you didn't request this code, you can safely ignore this email.",
  },
  "delete-account": {
    subjectLabel: "is your Jejaku account deletion code",
    leadIn: "Your account deletion code is",
    disclaimer:
      "This confirms permanently deleting your account and all its data. If you didn't request this, do not share this code with anyone, and consider signing in to check your account.",
  },
};

function otpEmailHtml(code: string, purpose: OtpPurpose) {
  const { leadIn, disclaimer } = OTP_COPY[purpose];
  return `
<div style="background-color:#f4faf8;padding:38px 15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #dce9e5;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background-color:#f4faf8;line-height:0;">
        <img src="${SITE_URL}/email-header.svg" width="480" height="128" alt="jejaku" style="display:block;width:100%;height:auto;border:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:30px 30px 8px;text-align:center;">
        <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:-0.1px;color:#00a19a;">jejaku</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 30px 0;text-align:center;">
        <p style="margin:0;font-size:14px;line-height:1.5;color:#5c766e;">${leadIn}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:15px 30px 0;text-align:center;">
        <div style="display:inline-block;background-color:#f4faf8;border:1px solid #dce9e5;border-radius:8px;padding:19px 26px;">
          <span style="font-size:34px;font-weight:600;letter-spacing:9px;color:#07211c;font-variant-numeric:tabular-nums;">${code}</span>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:11px 30px 0;text-align:center;">
        <p style="margin:0;font-size:12px;line-height:1.5;color:#8a9d97;">Tap and hold the code to copy it</p>
      </td>
    </tr>
    <tr>
      <td style="padding:19px 30px 0;text-align:center;">
        <p style="margin:0;font-size:13px;line-height:1.5;color:#5c766e;">This code expires in 10 minutes.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:23px 30px 30px;">
        <hr style="border:none;border-top:1px solid #dce9e5;margin:0 0 19px;" />
        <p style="margin:0;font-size:12px;line-height:1.5;color:#5c766e;text-align:center;">${disclaimer}</p>
      </td>
    </tr>
  </table>
</div>
`.trim();
}

export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose = "sign-in") {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] OTP for ${email} (${purpose}): ${code}`);
    return;
  }

  const { subjectLabel, leadIn } = OTP_COPY[purpose];
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: `Jejaku <${FROM_EMAIL}>`,
    to: email,
    subject: `${code} ${subjectLabel}`,
    text: `${leadIn} ${code}. It expires in 10 minutes.`,
    html: otpEmailHtml(code, purpose),
  });
}
