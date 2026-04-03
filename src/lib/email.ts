import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailContent {
  subject: string;
  html: string;
}

export function buildInviteEmail(params: {
  candidateName: string;
  roleName: string;
  token: string;
  baseUrl: string;
}): EmailContent {
  const link = `${params.baseUrl}/assess/${params.token}`;
  return {
    subject: `You're invited to Nymbl Ascent — ${params.roleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Nymbl Ascent</h1>
        <p>Hi ${params.candidateName},</p>
        <p>Thanks for applying to the <strong>${params.roleName}</strong> role at Nymbl!</p>
        <p>We'd love to get to know you better through a short interactive assessment. It takes about 10–15 minutes and consists of three stages.</p>
        <a href="${link}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Start Your Assessment</a>
        <p style="color: #666; font-size: 14px;">This link expires in 7 days. You can pause and resume at any time.</p>
      </div>
    `,
  };
}

export function buildCompletionEmail(params: {
  candidateName: string;
  roleName: string;
}): EmailContent {
  return {
    subject: "Thanks for completing Nymbl Ascent!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Nymbl Ascent</h1>
        <p>Hi ${params.candidateName},</p>
        <p>Thank you for completing the assessment for the <strong>${params.roleName}</strong> role. We appreciate the time you invested.</p>
        <p>Our team will review your results and be in touch soon.</p>
        <p>Best,<br/>The Nymbl Team</p>
      </div>
    `,
  };
}

export function buildResultsReadyEmail(params: {
  roleName: string;
  candidateName: string;
  baseUrl: string;
  candidateId: string;
}): EmailContent {
  const link = `${params.baseUrl}/admin/results/${params.candidateId}`;
  return {
    subject: `Results Ready: ${params.candidateName} — ${params.roleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">New Assessment Results</h1>
        <p>Assessment results are ready for <strong>${params.candidateName}</strong> applying to <strong>${params.roleName}</strong>.</p>
        <a href="${link}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">View Results</a>
      </div>
    `,
  };
}

export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  await transporter.sendMail({
    from: `"Nymbl Ascent" <${process.env.GMAIL_USER}>`,
    to,
    subject: content.subject,
    html: content.html,
  });
}
