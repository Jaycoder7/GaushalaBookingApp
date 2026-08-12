import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import BookingStatusPage from './BookingStatusPage';

describe('booking status lookup', () => {
  beforeEach(() => window.localStorage.clear());

  it('shows bookings saved on the current device', () => {
    window.localStorage.setItem('gaushala-recent-bookings', JSON.stringify([{
      token: '00000000-0000-4000-8000-000000000003',
      bookingId: '00000000-0000-4000-8000-000000000002',
      familyName: 'Patel family',
      slotDate: '2030-08-12',
      createdAt: '2030-08-01T00:00:00.000Z',
    }]));

    render(<MemoryRouter><BookingStatusPage /></MemoryRouter>);

    expect(screen.getByText('Patel family')).toBeVisible();
    expect(screen.getByRole('link', { name: /Patel family.*View status/i })).toHaveAttribute(
      'href',
      '/booking/00000000-0000-4000-8000-000000000003'
    );
  });
});
