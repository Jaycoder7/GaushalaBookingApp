import { describe, expect, it } from 'vitest';
import { AdminBooking } from '../services/admin.service';
import { manualEmailTemplate } from './admin-email-template';

const booking: AdminBooking = {
  id: 'booking-1',
  familyName: 'Sharma Family',
  phone: '+17705550100',
  email: 'sharma@example.com',
  headcount: 4,
  referredBy: 'A volunteer',
  isDonor: true,
  isVolunteer: false,
  visitLocation: 'Cumming, GA',
  termsAcceptedAt: '2030-08-01T12:00:00.000Z',
  noShowFeePledgedAt: '2030-08-01T12:00:00.000Z',
  consentVersion: 'interim-2026-08-09',
  note: 'First visit',
  status: 'pending',
  slotId: 'slot-1',
  slotDate: '2030-08-17',
  startTime: '13:00',
  endTime: '14:00',
  createdAt: '2030-08-01T12:00:00.000Z',
  manageLink: 'https://example.com/booking/private-token',
};

describe('manual admin email template', () => {
  it('personalizes a pending message without exposing the private address', () => {
    const result = manualEmailTemplate(booking);

    expect(result.copyText).toContain('To: sharma@example.com');
    expect(result.body).toContain('Hello Sharma Family');
    expect(result.body).toContain('4 visitors');
    expect(result.body).toContain('https://example.com/booking/private-token');
    expect(result.body).not.toContain('1945 Old Atlanta');
  });

  it('includes visit and parking addresses only after confirmation', () => {
    const result = manualEmailTemplate({ ...booking, status: 'confirmed' });

    expect(result.subject).toMatch(/^Confirmed:/);
    expect(result.body).toContain('1945 Old Atlanta Rd');
    expect(result.body).toContain('3100-3660 Melody Mizer Ln');
    expect(result.body).toContain('30–45 minute visit');
  });

  it('creates status-specific rejection wording', () => {
    const result = manualEmailTemplate({ ...booking, status: 'rejected' });

    expect(result.subject).toContain('Update on your Gaushala visit request');
    expect(result.body).toContain('unable to approve');
    expect(result.body).not.toContain('1945 Old Atlanta');
  });
});
