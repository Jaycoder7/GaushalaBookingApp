import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBooking } from '../services/bookings.service';
import CancelPage from './CancelPage';

vi.mock('../services/bookings.service', () => ({ getBooking: vi.fn(), cancelBooking: vi.fn() }));

const booking = {
  id: '00000000-0000-4000-8000-000000000002',
  familyName: 'Patel family',
  phone: '+15551234567',
  email: 'visitor@example.com',
  headcount: 3,
  isDonor: false,
  isVolunteer: false,
  visitLocation: 'Cumming, GA',
  slotDate: '2030-08-12',
  slotTime: '09:00',
  status: 'pending',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/booking/00000000-0000-4000-8000-000000000003']}>
      <Routes><Route path="/booking/:token" element={<CancelPage />} /></Routes>
    </MemoryRouter>
  );
}

describe('booking management page', () => {
  beforeEach(() => vi.mocked(getBooking).mockReset());

  it('keeps exact addresses hidden while approval is pending', async () => {
    vi.mocked(getBooking).mockResolvedValue(booking);
    renderPage();
    expect(await screen.findByText(/awaiting administrator approval/i)).toBeVisible();
    expect(screen.queryByText(/1945 Old Atlanta/i)).not.toBeInTheDocument();
  });

  it('reveals map links after approval', async () => {
    vi.mocked(getBooking).mockResolvedValue({
      ...booking,
      status: 'confirmed',
      visitAddress: '1945 Old Atlanta Rd, Cumming, GA 30041',
      parkingAddress: '3100-3660 Melody Mizer Ln, Cumming, GA 30041',
    });
    renderPage();
    expect(await screen.findByRole('link', { name: /1945 Old Atlanta/i })).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
    expect(screen.getByRole('link', { name: /Melody Mizer/i })).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
  });
});
