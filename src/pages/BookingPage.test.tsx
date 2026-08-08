import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookingPage from './BookingPage';
import { getAvailableSlots } from '../services/slots.service';

vi.mock('../services/slots.service', () => ({ getAvailableSlots: vi.fn() }));

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
  beforeEach(() => vi.mocked(getAvailableSlots).mockResolvedValue([openSlot]));

  it('shows the admin login entry point', async () => {
    render(<MemoryRouter><BookingPage /></MemoryRouter>);
    expect(await screen.findByRole('link', { name: /admin login/i })).toHaveAttribute('href', '/admin');
  });

  it('shows remaining family capacity for each visit time', async () => {
    render(<MemoryRouter><BookingPage /></MemoryRouter>);
    expect(await screen.findByText('4 family spots left')).toBeVisible();
  });
});
