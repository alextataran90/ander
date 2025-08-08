import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(apiKey);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
      attachments: params.attachments || [],
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendBloodSugarReport(
  recipientEmail: string,
  userEmail: string,
  pdfBuffer: Buffer,
  dateRange: { start: string; end: string },
  readingCount: number
): Promise<boolean> {
  const subject = `Blood Sugar Report - ${dateRange.start} to ${dateRange.end}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Your Blood Sugar Report</h2>
      
      <p>Hello,</p>
      
      <p>Your blood sugar report for <strong>${dateRange.start}</strong> to <strong>${dateRange.end}</strong> is ready!</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Report Summary:</h3>
        <ul style="margin: 0;">
          <li><strong>Total Readings:</strong> ${readingCount}</li>
          <li><strong>Period:</strong> ${dateRange.start} to ${dateRange.end}</li>
          <li><strong>Generated:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
      </div>
      
      <p>Please find your detailed blood sugar report attached as a PDF. This report includes all your readings with blood sugar levels, meal information, carbohydrate intake, activity levels, and notes for the selected period.</p>
      
      <p style="color: #6B7280; font-size: 14px;">
        <strong>Note:</strong> This report is for personal health tracking purposes. Please consult with your healthcare provider for medical advice and treatment decisions.
      </p>
      
      <p>Stay healthy!</p>
      
      <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
        This email was generated automatically from your blood sugar tracking app.
      </p>
    </div>
  `;

  const textContent = `
Your Blood Sugar Report - ${dateRange.start} to ${dateRange.end}

Your blood sugar report is ready!

Report Summary:
- Total Readings: ${readingCount}
- Period: ${dateRange.start} to ${dateRange.end}
- Generated: ${new Date().toLocaleDateString()}

Please find your detailed blood sugar report attached as a PDF. This report includes all your readings with blood sugar levels, meal information, carbohydrate intake, activity levels, and notes for the selected period.

Note: This report is for personal health tracking purposes. Please consult with your healthcare provider for medical advice and treatment decisions.

Stay healthy!
  `;

  // For SendGrid free accounts, sender must be verified. Using recipient email as sender
  // since users can send emails to themselves without domain verification
  return sendEmail({
    to: recipientEmail,
    from: recipientEmail, // Use recipient email as sender (allowed for self-send)
    subject,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `blood-sugar-report-${dateRange.start}-to-${dateRange.end}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });
}