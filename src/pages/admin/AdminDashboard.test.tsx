import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminService from '../../services/admin.service';
import AdminDashboard from './AdminDashboard';

vi.mock('../../services/admin.service', async importOriginal => {
  const actual = await importOriginal<typeof import('../../services/admin.service')>();
  return {
    ...actual,
    getAdminSummary: vi.fn(),
    getAdminBookings: vi.fn(),
    getSlotTemplates: vi.fn(),
    getAdminSlots: vi.fn(),
  };
});

const booking: adminService.AdminBooking = {
  id: 'booking-1',
  familyName: 'Sharma Family',
  phone: '+17705550100',
  email: 'sharma@example.com',
  headcount: 4,
  referredBy: 'Gaushala volunteer',
  isDonor: true,
  isVolunteer: false,
  visitLocation: 'Cumming, GA',
  termsAcceptedAt: '2030-08-01T12:00:00.000Z',
  noShowFeePledgedAt: '2030-08-01T12:00:00.000Z',
  consentVersion: 'interim-2026-08-09',
  note: 'First visit with grandparents',
  status: 'confirmed',
  slotId: 'slot-1',
  slotDate: '2030-08-17',
  startTime: '13:00',
  endTime: '14:00',
  createdAt: '2030-08-01T12:00:00.000Z',
  manageLink: 'https://example.com/booking/private-token',
};

describe('admin booking list', () => {
  beforeEach(() => {
    localStorage.setItem('admin_token', 'test-token');
    vi.mocked(adminService.getAdminSummary).mockResolvedValue({
      todayBookings: 0,
      todayVisitors: 0,
      upcomingBookings: 1,
      cancellations: 0,
      pendingApprovals: 0,
    });
    vi.mocked(adminService.getAdminBookings).mockResolvedValue([booking]);
    vi.mocked(adminService.getSlotTemplates).mockResolvedValue([]);
    vi.mocked(adminService.getAdminSlots).mockResolvedValue([]);
  });

  it('keeps form responses condensed until the administrator expands a booking', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    expect(await screen.findByText('Sharma Family')).toBeVisible();
    expect(screen.queryByText('+17705550100')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View details' }));

    expect(screen.getByText('+17705550100')).toBeVisible();
    expect(screen.getByText('Gaushala volunteer')).toBeVisible();
    expect(screen.getByText('First visit with grandparents')).toBeVisible();
    expect(screen.getByText(/Accepted Aug 1, 2030/)).toBeVisible();
    expect(screen.getByText(/Pledged Aug 1, 2030/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Manual email' })).toBeVisible();
    expect(screen.getByText(/1945 Old Atlanta Rd/)).toBeVisible();
  });

  it('copies a fully personalized email for the selected booking', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: 'View details' }));
    await user.click(screen.getByRole('button', { name: 'Copy email' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('To: sharma@example.com'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Hello Sharma Family'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('4 visitors'));
  });
});
