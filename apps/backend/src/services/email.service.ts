import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  try {
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

// Email templates
export const emailTemplates = {
  bookingConfirmation: (familyName: string, date: string, time: string, cancellationLink: string) => `
    <h2>Booking Confirmed</h2>
    <p>Hello ${familyName},</p>
    <p>Your Gaushala visit is confirmed for <strong>${date} at ${time}</strong>.</p>
    <p><a href="${cancellationLink}">Cancel Booking</a></p>
  `,
  
  adminNotification: (familyName: string, phone: string, headcount: number, date: string, time: string) => `
    <h2>New Booking</h2>
    <p>Family: ${familyName}</p>
    <p>Phone: ${phone}</p>
    <p>Headcount: ${headcount}</p>
    <p>Date: ${date} at ${time}</p>
  `,
};
