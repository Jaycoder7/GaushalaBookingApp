import { expect, test } from '@playwright/test';

const slot = {
  id: '00000000-0000-4000-8000-000000000001',
  date: '2030-08-12',
  startTime: '09:00',
  endTime: '10:00',
  familyCapacity: 6,
  familyBookingsCount: 2,
  remainingCapacity: 4,
  status: 'open',
};

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:5000/api/slots**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ slots: [slot] }),
  }));
});

test('public booking flow confirms a reservation', async ({ page }) => {
  await page.route('http://localhost:5000/api/bookings', route => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({
      id: '00000000-0000-4000-8000-000000000002',
      status: 'confirmed',
      cancellationToken: '00000000-0000-4000-8000-000000000003',
      cancellationLink: '/cancel/00000000-0000-4000-8000-000000000003',
    }),
  }));
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Admin login' })).toBeVisible();
  await expect(page.getByText('4 family spots left')).toBeVisible();
  await page.getByRole('button', { name: /9:00 AM.*4 family spots left/i }).click();
  await page.getByLabel('Family name').fill('Patel family');
  await page.getByLabel('Phone').fill('+15551234567');
  await page.getByLabel('Email').fill('visitor@example.com');
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.getByText('Booking confirmed')).toBeVisible();
});
