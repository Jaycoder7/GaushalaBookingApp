import { Resend } from 'resend';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is not configured');
    }
    console.log(`[EMAIL STUB] To: ${to}, Subject: ${subject}`);
    return { data: null, error: null };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@gaushala.com',
      to,
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character] as string));
}

// Email templates
export const emailTemplates = {
  bookingConfirmation: (familyName: string, date: string, time: string, cancellationLink: string) => `
    <h2>Booking Confirmed</h2>
    <p>Hello ${escapeHtml(familyName)},</p>
    <p>Your Gaushala visit is confirmed for <strong>${escapeHtml(date)} at ${escapeHtml(time)}</strong>.</p>
    <p><a href="${escapeHtml(cancellationLink)}">Cancel Booking</a></p>
  `,
  
  adminNotification: (familyName: string, phone: string, headcount: number, date: string, time: string) => `
    <h2>New Booking</h2>
    <p>Family: ${escapeHtml(familyName)}</p>
    <p>Phone: ${escapeHtml(phone)}</p>
    <p>Headcount: ${headcount}</p>
    <p>Date: ${escapeHtml(date)} at ${escapeHtml(time)}</p>
  `,

  cancellationConfirmation: (familyName: string, date: string, time: string) => `
    <h2>Booking Cancelled</h2>
    <p>Hello ${escapeHtml(familyName)},</p>
    <p>Your Gaushala visit for <strong>${escapeHtml(date)} at ${escapeHtml(time)}</strong> has been cancelled.</p>
  `,
};
