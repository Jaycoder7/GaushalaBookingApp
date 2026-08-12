-- Migration: add_booking_visit_profile
-- Created: 2026-08-12T17:02:12.521Z

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_donor BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_volunteer BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS visit_location VARCHAR(100) NOT NULL DEFAULT 'Cumming, GA';

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_visit_location_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_visit_location_check
  CHECK (visit_location IN ('Cumming, GA'));
