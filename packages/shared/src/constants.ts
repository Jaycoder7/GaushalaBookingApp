export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const HEADCOUNT_LIMITS = {
  MIN: 1,
  MAX: 6,
};

export const BOOKING_CAPACITY_LIMITS = {
  MIN_FAMILY_CAPACITY: 1,
  MAX_FAMILY_CAPACITY: 20,
  DEFAULT_FAMILY_CAPACITY: 6,
};

export const SLOT_GENERATION = {
  FUTURE_DAYS: 60, // Generate slots for next 60 days
  MIN_FUTURE_DAYS: 30, // Keep at least 30 days in future
};

export const RATE_LIMITS = {
  BOOKING_WINDOW_MS: 900000, // 15 minutes
  BOOKING_MAX_REQUESTS: 10,
};

export const EMAIL_CONFIG = {
  CONFIRMATION_SUBJECT: 'Your Gaushala Visit is Confirmed',
  CANCELLATION_SUBJECT: 'Your Booking Has Been Cancelled',
  ADMIN_NOTIFICATION_SUBJECT: 'New Gaushala Booking',
};
