import { Resend } from "resend";

const FROM_EMAIL = process.env.OTP_FROM_EMAIL ?? "otp@jejaku.my";
const SITE_URL = process.env.NEXT_PUBLIC_JEJAKU_URL ?? "https://jejaku.my";

function otpEmailHtml(code: string) {
  const digits = code.split("");
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
        <p style="margin:0;font-size:14px;line-height:1.5;color:#5c766e;">Your sign-in code is</p>
      </td>
    </tr>
    <tr>
      <td style="padding:15px 30px 0;text-align:center;">
        <div style="display:inline-block;background-color:#f4faf8;border:1px solid #dce9e5;border-radius:8px;padding:15px 19px;">
          <span style="font-size:30px;font-weight:600;letter-spacing:8px;color:#07211c;font-variant-numeric:tabular-nums;">${digits.join(" ")}</span>
        </div>
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
        <p style="margin:0;font-size:12px;line-height:1.5;color:#5c766e;text-align:center;">If you didn't request this code, you can safely ignore this email.</p>
      </td>
    </tr>
  </table>
</div>
`.trim();
}

export async function sendOtpEmail(email: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] OTP for ${email}: ${code}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: `Jejaku <${FROM_EMAIL}>`,
    to: email,
    subject: `${code} is your Jejaku code`,
    text: `Your Jejaku sign-in code is ${code}. It expires in 10 minutes.`,
    html: otpEmailHtml(code),
  });
}
