// server/email.ts
import sgMail, { MailDataRequired } from "@sendgrid/mail";

/**
 * Environment
 */
const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM; // MUST be a verified sender/domain in SendGrid

if (!API_KEY) throw new Error("Missing SENDGRID_API_KEY");
if (!FROM_EMAIL) throw new Error("Missing SENDGRID_FROM");

sgMail.setApiKey(API_KEY);

/**
 * Types
 */
export interface EmailAttachment {
  /** Base64 string (no "data:...;base64," prefix) */
  content: string;
  filename: string;
  type: string; // e.g. "application/pdf"
  disposition?: "attachment" | "inline";
}

export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  /** Optional reply-to (so the recipient can reply to a different address) */
  replyToEmail?: string;
  attachments?: EmailAttachment[];
}

/**
 * Low-level send
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const msg: MailDataRequired = {
      to: params.to,
      from: FROM_EMAIL, // ✅ must be verified in SendGrid
      subject: params.subject,
      text: params.text || "",
      html: params.html || "",
      attachments: params.attachments?.map((a) => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: a.disposition ?? "attachment",
      })),
      ...(params.replyToEmail ? { replyTo: { email: params.replyToEmail } } : {}),
    };

    await sgMail.send(msg);
    return true;
  } catch (err: any) {
    // SendGrid puts details in err.response.body
    const details = err?.response?.body ? JSON.stringify(err.response.body) : "";
    console.error("SendGrid email error:", err?.message || err, details);
    return false;
  }
}

/**
 * High-level helper for the Blood Sugar PDF report
 * - recipientEmail: who receives the email
 * - userEmail: optional; used as reply-to so replies go to the user
 * - pdfBuffer: PDF bytes to attach
 * - dateRange: { start, end } strings (display only)
 * - readingCount: number to show in the summary
 */
export async function sendBloodSugarReport(
  recipientEmail: string,
  userEmail: string | undefined,
  pdfBuffer: Buffer,
  dateRange: { start: string; end: string },
  readingCount: number
): Promise<boolean> {
  const subject = `Blood Sugar Report — ${dateRange.start} to ${dateRange.end}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color:#2563EB;margin:0 0 12px;">Your Blood Sugar Report</h2>
      <p style="margin:0 0 12px;">Here is your report for <strong>${dateRange.start}</strong> to <strong>${dateRange.end}</strong>.</p>
      <div style="background:#F3F4F6;border-radius:10px;padding:16px;margin:12px 0;">
        <p style="margin:0 0 6px;"><strong>Total readings:</strong> ${readingCount}</p>
        <p style="margin:0;"><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p style="color:#6B7280;font-size:13px;margin-top:16px;">
        This report is for personal health tracking only. For medical advice, consult your healthcare provider.
      </p>
    </div>
  `;

  const text = `Your Blood Sugar Report (${dateRange.start} → ${dateRange.end})
Total readings: ${readingCount}
Generated: ${new Date().toLocaleDateString()}
The PDF report is attached.`;

  // Ensure the buffer is base64 without any data: prefix
  const pdfBase64 = pdfBuffer.toString("base64");

  return sendEmail({
    to: recipientEmail,
    replyToEmail: userEmail, // so replies go to the user (optional)
    subject,
    text,
    html,
    attachments: [
      {
        content: pdfBase64,
        filename: `blood-sugar-report-${dateRange.start}-to-${dateRange.end}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  });
}
