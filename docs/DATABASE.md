# Database Schema

## Tables

### admin_users
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### slot_templates
```sql
CREATE TABLE slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  days_of_week INT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_length_minutes INT NOT NULL,
  family_capacity_per_slot INT NOT NULL DEFAULT 6,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### slots
```sql
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES slot_templates(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  family_capacity INT NOT NULL,
  family_bookings_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open',
  google_calendar_event_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, start_time, end_time)
);

CREATE INDEX idx_slots_date ON slots(date);
CREATE INDEX idx_slots_status ON slots(status);
```

### bookings
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  family_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  headcount INT NOT NULL CHECK (headcount >= 1 AND headcount <= 6),
  note TEXT,
  status VARCHAR(50) DEFAULT 'confirmed',
  cancellation_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  UNIQUE(slot_id, phone),
  UNIQUE(slot_id, email)
);

CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_phone ON bookings(phone);
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_cancellation_token ON bookings(cancellation_token);
```

## Migrations

Migrations are in `apps/backend/src/migrations/`.

Run migrations:
```bash
cd apps/backend
npm run migrate
```

Create new migration:
```bash
npm run migration:create -- description_here
```
