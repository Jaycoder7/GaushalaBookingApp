-- Migration: booking_approval_workflow
-- Created: 2026-08-12T13:16:02.099Z

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'no_show'));

DROP INDEX IF EXISTS uniq_confirmed_phone_per_slot;
DROP INDEX IF EXISTS uniq_confirmed_email_per_slot;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_phone_per_slot
  ON bookings(slot_id, phone)
  WHERE status IN ('pending', 'confirmed');

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_email_per_slot
  ON bookings(slot_id, LOWER(email))
  WHERE status IN ('pending', 'confirmed');
