-- Migration: add_booking_consent_records
-- Created: 2026-08-13T01:26:37.035Z

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_fee_pledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version VARCHAR(50);

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_consent_record_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_consent_record_check CHECK (
    (terms_accepted_at IS NULL AND no_show_fee_pledged_at IS NULL AND consent_version IS NULL)
    OR
    (terms_accepted_at IS NOT NULL AND no_show_fee_pledged_at IS NOT NULL AND consent_version IS NOT NULL)
  );
