# Database

PostgreSQL is the source of truth. The executable schema is
`apps/backend/src/database/migrations/01_init.sql`.

## Main tables

- `admin_users`: the whitelisted Google account seen by the application.
- `slot_templates`: weekly opening days, hours, slot duration, and family capacity.
- `slots`: generated dated availability, booking count, block state, and Calendar event ID.
- `bookings`: visitor contact details, headcount, status, and cancellation token.

Confirmed bookings are unique by phone and email within a slot. Partial unique
indexes allow a visitor to book the same slot again only after the earlier
booking has been cancelled. Slot capacity is recalculated inside the same
database transaction as every create or status change.

## Migrations

From the repository root:

```bash
npm run migrate --workspace=gaushala-backend
```

The initial migration is idempotent for a new database and seeds the default
Monday–Saturday, 9:00–17:00 schedule when no schedule exists.
