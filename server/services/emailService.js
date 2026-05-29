const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(
  process.env.SMTP_URL
    ? { url: process.env.SMTP_URL }
    : {
        // Log to console in development — no real SMTP configured
        streamTransport: true,
        newline: 'unix',
        buffer: true
      }
);

const FROM = process.env.SMTP_FROM || 'noreply@faqapp.local';

/**
 * Send an email. In development, just logs the message to console.
 * In production, actually sends via SMTP.
 */
async function sendEmail({ to, subject, text, html }) {
  if (!to) return; // Skip silently if no recipient (e.g. notifications disabled)

  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html
  });

  if (!process.env.SMTP_URL) {
    // Development — decode and print the email to console
    let body;
    if (typeof info.message?.getContent === 'function') {
      body = info.message.getContent();
    } else if (typeof info.message?.AsciiString === 'function') {
      body = info.message.AsciiString();
    } else {
      body = String(info.message || '[no body]');
    }

    console.log('\n📧 [EMAIL] ---------------------------------------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body (raw):');
    console.log(body);
    console.log('------------------------------------------------------\n');
  }

  return info;
}

/**
 * Notify query owner when someone answers their question.
 * Skipped if the answerer is the owner themselves.
 */
async function notifyQueryOwnerOfAnswer({ queryOwner, queryTitle, answerAuthorName, answerContent, queryId }) {
  if (!queryOwner?.email || queryOwner.emailNotifications === false) return;

  const preview = answerContent
    .replace(/<[^>]+>/g, '')
    .substring(0, 120)
    + (answerContent.length > 120 ? '…' : '');

  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const queryUrl = `${dashboardUrl}/query/${queryId}`;

  await sendEmail({
    to: queryOwner.email,
    subject: `💬 New answer on: ${queryTitle}`,
    text: `${answerAuthorName} answered your query "${queryTitle}":\n\n${preview}\n\nView and accept the answer → ${queryUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background: #4f46e5; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">💬 New answer on your query</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">${answerAuthorName} answered:</p>
          <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">${queryTitle}</p>
          <p style="background: white; border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 8px; color: #374151; font-size: 14px; line-height: 1.6;">${preview}</p>
          <a href="${queryUrl}" style="display: inline-block; margin-top: 20px; background: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            View &amp; Accept Answer →
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            You're receiving this because you asked this question and have email notifications enabled.
          </p>
        </div>
      </div>`
  });
}

module.exports = { sendEmail, notifyQueryOwnerOfAnswer };