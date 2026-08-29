import { Resend } from "resend";

const FROM_EMAIL = process.env.OTP_FROM_EMAIL ?? "otp@jejaku.my";

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
  });
}
