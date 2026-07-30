CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  days_of_week INT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_length_minutes INT NOT NULL CHECK (slot_length_minutes BETWEEN 15 AND 480),
  family_capacity_per_slot INT NOT NULL DEFAULT 6 CHECK (family_capacity_per_slot BETWEEN 1 AND 20),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES slot_templates(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  family_capacity INT NOT NULL CHECK (family_capacity BETWEEN 1 AND 20),
  family_bookings_count INT NOT NULL DEFAULT 0 CHECK (family_bookings_count >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'blocked', 'past')),
  blocked_reason TEXT,
  google_calendar_event_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, start_time, end_time),
  CHECK (start_time < end_time),
  CHECK (family_bookings_count <= family_capacity)
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  family_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  headcount INT NOT NULL CHECK (headcount BETWEEN 1 AND 6),
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'no_show')),
  cancellation_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_slots_date_status ON slots(date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_status ON bookings(slot_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_token ON bookings(cancellation_token);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_confirmed_phone_per_slot
  ON bookings(slot_id, phone)
  WHERE status = 'confirmed';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_confirmed_email_per_slot
  ON bookings(slot_id, LOWER(email))
  WHERE status = 'confirmed';

INSERT INTO slot_templates (
  days_of_week,
  start_time,
  end_time,
  slot_length_minutes,
  family_capacity_per_slot
)
SELECT ARRAY[1, 2, 3, 4, 5, 6], '09:00', '17:00', 60, 6
WHERE NOT EXISTS (SELECT 1 FROM slot_templates);
