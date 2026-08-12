import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import BookingPage from './BookingPage';
import { createBooking } from '../services/bookings.service';
import { getAvailableSlots } from '../services/slots.service';

vi.mock('../services/slots.service', () => ({ getAvailableSlots: vi.fn() }));
vi.mock('../services/bookings.service', () => ({ createBooking: vi.fn() }));

const openSlot = {
  id: '00000000-0000-4000-8000-000000000001',
  date: '2030-08-12',
  startTime: '09:00',
  endTime: '10:00',
  familyCapacity: 6,
  familyBookingsCount: 2,
  remainingCapacity: 4,
  status: 'open' as const,
};

describe('public booking page', () => {
  beforeEach(() => {
    vi.mocked(getAvailableSlots).mockReset().mockResolvedValue([openSlot]);
    vi.mocked(createBooking).mockReset();
  });

  it('shows the admin login entry point', async () => {
    render(<MemoryRouter><BookingPage /></MemoryRouter>);
    expect(await screen.findByRole('link', { name: /admin login/i })).toHaveAttribute('href', '/admin');
  });

  it('shows remaining family capacity for each visit time', async () => {
    render(<MemoryRouter><BookingPage /></MemoryRouter>);
    expect(await screen.findByText('4 family spots left')).toBeVisible();
  });

  it('refreshes stale capacity after a duplicate booking response', async () => {
    const user = userEvent.setup();
    vi.mocked(getAvailableSlots)
      .mockResolvedValueOnce([{ ...openSlot, familyBookingsCount: 0, remainingCapacity: 6 }])
      .mockResolvedValueOnce([{ ...openSlot, familyBookingsCount: 1, remainingCapacity: 5 }]);
    vi.mocked(createBooking).mockRejectedValue({
      isAxiosError: true,
      response: { data: { code: 'DUPLICATE_BOOKING', error: 'This phone number or email already has a booking for that slot.' } },
    });

    render(<MemoryRouter><BookingPage /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /09:00 am - 10:00 am/i }));
    await user.type(screen.getByLabelText('Family name'), 'Agrawal');
    await user.type(screen.getByLabelText('Phone'), '7708332230');
    await user.type(screen.getByLabelText('Email'), 'visitor@example.com');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByText('5 family spots left')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('already has a booking for that slot');
    expect(getAvailableSlots).toHaveBeenCalledTimes(2);
  });

  it('shows an awaiting-approval receipt without a calendar link for a new request', async () => {
    const user = userEvent.setup();
    vi.mocked(createBooking).mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000002',
      status: 'pending',
      cancellationToken: '00000000-0000-4000-8000-000000000003',
      cancellationLink: '/cancel/00000000-0000-4000-8000-000000000003',
    });

    render(<MemoryRouter><BookingPage /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /09:00 am - 10:00 am/i }));
    await user.type(screen.getByLabelText('Family name'), 'Agrawal');
    await user.type(screen.getByLabelText('Phone'), '7708332230');
    await user.type(screen.getByLabelText('Email'), 'visitor@example.com');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    expect(await screen.findByRole('heading', { name: /awaiting admin approval/i })).toBeVisible();
    expect(screen.queryByRole('link', { name: /add to google calendar/i })).not.toBeInTheDocument();
    expect(screen.getByText(/confirmation email and calendar invitation after an administrator approves/i)).toBeVisible();
  });
});
