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
  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html
  });

  if (!process.env.SMTP_URL) {
    // Development — decode and print the email to console
    // Handle different nodemailer version APIs
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

module.exports = { sendEmail };
