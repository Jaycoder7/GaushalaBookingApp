export interface RecentBooking {
  token: string;
  bookingId: string;
  familyName: string;
  slotDate: string;
  createdAt: string;
}

const STORAGE_KEY = 'gaushala-recent-bookings';
const MAX_RECENT_BOOKINGS = 10;

export function getRecentBookings(): RecentBooking[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored)
      ? stored.filter(item => item && typeof item.token === 'string' && typeof item.bookingId === 'string')
      : [];
  } catch {
    return [];
  }
}

export function rememberBooking(booking: RecentBooking) {
  const recent = getRecentBookings().filter(item => item.token !== booking.token);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([booking, ...recent].slice(0, MAX_RECENT_BOOKINGS)));
}
