import express from 'express';
import { QueryResultRow } from 'pg';
import { query, withTransaction } from '../database/connection';
import { HttpError } from '../errors';
import { adminAuthMiddleware } from '../middleware/auth.middleware';
import { authenticateGoogleCredential, generateToken } from '../services/auth.service';
import { queueCalendarSync } from '../services/calendar.service';
import { ensureSlotsGenerated, publicSlot, recalculateSlot, SlotRow } from '../services/slots.service';

const router = express.Router();
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

interface AdminBookingRow extends QueryResultRow {
  id: string;
  family_name: string;
  phone: string;
  email: string;
  headcount: number;
  note: string | null;
  status: string;
  slot_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  created_at: Date;
}

function serializeBooking(row: AdminBookingRow) {
  return {
    id: row.id,
    familyName: row.family_name,
    phone: row.phone,
    email: row.email,
    headcount: row.headcount,
    note: row.note || undefined,
    status: row.status,
    slotId: row.slot_id,
    slotDate: row.slot_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    createdAt: row.created_at,
  };
}

function bookingFilters(queryParams: express.Request['query']) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  const add = (clause: string, value: unknown) => {
    values.push(value);
    clauses.push(clause.replace('?', `$${values.length}`));
  };
  if (typeof queryParams.startDate === 'string' && DATE.test(queryParams.startDate)) add('s.date >= ?', queryParams.startDate);
  if (typeof queryParams.endDate === 'string' && DATE.test(queryParams.endDate)) add('s.date <= ?', queryParams.endDate);
  if (typeof queryParams.status === 'string' && ['confirmed', 'cancelled', 'no_show'].includes(queryParams.status)) {
    add('b.status = ?', queryParams.status);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
}

router.post('/auth/google', async (req, res, next) => {
  try {
    if (!req.body?.credential || typeof req.body.credential !== 'string') {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Google credential is required.');
    }
    const admin = await authenticateGoogleCredential(req.body.credential);
    if (!admin) throw new HttpError(403, 'FORBIDDEN', 'This Google account is not authorized.');

    await query(
      `INSERT INTO admin_users (google_account_email)
       VALUES ($1)
       ON CONFLICT (google_account_email) DO UPDATE SET updated_at = NOW()`,
      [admin.email.toLowerCase()]
    );
    res.json({ token: generateToken(admin), admin: { email: admin.email } });
  } catch (error) {
    next(error);
  }
});

router.use(adminAuthMiddleware);

router.get('/summary', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE s.date = CURRENT_DATE AND b.status = 'confirmed')::int AS today_bookings,
         COALESCE(SUM(b.headcount) FILTER (WHERE s.date = CURRENT_DATE AND b.status = 'confirmed'), 0)::int AS today_visitors,
         COUNT(*) FILTER (WHERE s.date >= CURRENT_DATE AND b.status = 'confirmed')::int AS upcoming_bookings,
         COUNT(*) FILTER (WHERE b.status = 'cancelled')::int AS cancellations
       FROM bookings b
       JOIN slots s ON s.id = b.slot_id`
    );
    const row = result.rows[0];
    res.json({
      todayBookings: row.today_bookings,
      todayVisitors: row.today_visitors,
      upcomingBookings: row.upcoming_bookings,
      cancellations: row.cancellations,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/bookings/export', async (req, res, next) => {
  try {
    const filters = bookingFilters(req.query);
    const result = await query<AdminBookingRow>(
      `SELECT b.*, s.date::text AS slot_date, s.start_time::text, s.end_time::text
         FROM bookings b JOIN slots s ON s.id = b.slot_id
         ${filters.where}
        ORDER BY s.date, s.start_time`,
      filters.values
    );
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['Date', 'Start time', 'End time', 'Family', 'Phone', 'Email', 'Headcount', 'Status', 'Note'];
    const rows = result.rows.map(row => [
      row.slot_date, row.start_time.slice(0, 5), row.end_time.slice(0, 5), row.family_name,
      row.phone, row.email, row.headcount, row.status, row.note || '',
    ]);
    res.type('text/csv');
    res.attachment('gaushala-bookings.csv');
    res.send([header, ...rows].map(row => row.map(escape).join(',')).join('\n'));
  } catch (error) {
    next(error);
  }
});

router.get('/bookings', async (req, res, next) => {
  try {
    const filters = bookingFilters(req.query);
    const result = await query<AdminBookingRow>(
      `SELECT b.*, s.date::text AS slot_date, s.start_time::text, s.end_time::text
         FROM bookings b JOIN slots s ON s.id = b.slot_id
         ${filters.where}
        ORDER BY s.date DESC, s.start_time`,
      filters.values
    );
    res.json({ bookings: result.rows.map(serializeBooking) });
  } catch (error) {
    next(error);
  }
});

router.post('/bookings', async (req, res, next) => {
  try {
    const { slotId, familyName, phone, email, headcount, note } = req.body || {};
    if (
      typeof slotId !== 'string' ||
      typeof familyName !== 'string' || familyName.trim().length < 2 ||
      typeof phone !== 'string' || !/^\+?[1-9]\d{1,14}$/.test(phone) ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !Number.isInteger(headcount) || headcount < 1 || headcount > 6
    ) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid manual booking details.');
    }

    const booking = await withTransaction(async client => {
      const slotResult = await client.query(
        `SELECT id, date::text, start_time::text, end_time::text,
                family_capacity, family_bookings_count, status
           FROM slots WHERE id = $1 FOR UPDATE`,
        [slotId]
      );
      const slot = slotResult.rows[0];
      if (!slot) throw new HttpError(404, 'SLOT_NOT_FOUND', 'Slot not found.');
      if (slot.status === 'blocked' || slot.status === 'past' || slot.family_bookings_count >= slot.family_capacity) {
        throw new HttpError(409, 'SLOT_UNAVAILABLE', 'That visit time is not available.');
      }
      const duplicate = await client.query(
        `SELECT 1 FROM bookings
          WHERE slot_id = $1 AND status = 'confirmed'
            AND (phone = $2 OR LOWER(email) = LOWER($3))`,
        [slotId, phone, email]
      );
      if (duplicate.rowCount) {
        throw new HttpError(409, 'DUPLICATE_BOOKING', 'This visitor already has a booking for that time.');
      }
      const inserted = await client.query<AdminBookingRow>(
        `INSERT INTO bookings (slot_id, family_name, phone, email, headcount, note)
         VALUES ($1, $2, $3, LOWER($4), $5, $6)
         RETURNING id, family_name, phone, email, headcount, note, status,
                   slot_id, created_at`,
        [slotId, familyName.trim(), phone, email.trim(), headcount, typeof note === 'string' && note.trim() ? note.trim() : null]
      );
      await recalculateSlot(client, slotId);
      return {
        ...inserted.rows[0],
        slot_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      } as AdminBookingRow;
    });
    queueCalendarSync(booking.slot_id);
    res.status(201).json(serializeBooking(booking));
  } catch (error) {
    next(error);
  }
});

router.patch('/bookings/:bookingId/status', async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!['confirmed', 'cancelled', 'no_show'].includes(status)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Status must be confirmed, cancelled, or no_show.');
    }
    const booking = await withTransaction(async client => {
      const existing = await client.query<AdminBookingRow>(
        `SELECT b.*, s.date::text AS slot_date, s.start_time::text, s.end_time::text
           FROM bookings b JOIN slots s ON s.id = b.slot_id
          WHERE b.id = $1 FOR UPDATE OF b, s`,
        [req.params.bookingId]
      );
      const row = existing.rows[0];
      if (!row) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
      await client.query(
        `UPDATE bookings
            SET status = $1,
                cancelled_at = CASE WHEN $1 = 'cancelled' THEN COALESCE(cancelled_at, NOW()) ELSE NULL END,
                updated_at = NOW()
          WHERE id = $2`,
        [status, row.id]
      );
      await recalculateSlot(client, row.slot_id);
      return { ...row, status };
    });
    queueCalendarSync(booking.slot_id);
    res.json(serializeBooking(booking));
  } catch (error: any) {
    if (error?.code === '23505') {
      next(new HttpError(409, 'DUPLICATE_BOOKING', 'Restoring this booking would create a duplicate.'));
      return;
    }
    next(error);
  }
});

router.get('/slot-templates', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, days_of_week, start_time::text, end_time::text,
              slot_length_minutes, family_capacity_per_slot, active
         FROM slot_templates
        ORDER BY active DESC, created_at DESC`
    );
    res.json({
      templates: result.rows.map(row => ({
        id: row.id,
        daysOfWeek: row.days_of_week,
        startTime: row.start_time.slice(0, 5),
        endTime: row.end_time.slice(0, 5),
        slotLengthMinutes: row.slot_length_minutes,
        familyCapacityPerSlot: row.family_capacity_per_slot,
        active: row.active,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/slots', async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === 'string'
      ? req.query.startDate
      : new Date().toISOString().slice(0, 10);
    const defaultEnd = new Date();
    defaultEnd.setUTCDate(defaultEnd.getUTCDate() + 30);
    const endDate = typeof req.query.endDate === 'string'
      ? req.query.endDate
      : defaultEnd.toISOString().slice(0, 10);
    if (!DATE.test(startDate) || !DATE.test(endDate)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Dates must use YYYY-MM-DD format.');
    }
    await ensureSlotsGenerated(startDate, endDate);
    const result = await query<SlotRow & { blocked_reason: string | null }>(
      `SELECT id, date::text, start_time::text, end_time::text, family_capacity,
              family_bookings_count, status, blocked_reason
         FROM slots
        WHERE date BETWEEN $1 AND $2
        ORDER BY date, start_time`,
      [startDate, endDate]
    );
    res.json({
      slots: result.rows.map(row => ({
        ...publicSlot(row),
        blockedReason: row.blocked_reason || undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/slot-templates', async (req, res, next) => {
  try {
    const {
      id, daysOfWeek, startTime, endTime, slotLengthMinutes,
      familyCapacityPerSlot, active = true,
    } = req.body || {};
    if (
      !Array.isArray(daysOfWeek) || !daysOfWeek.length ||
      daysOfWeek.some(day => !Number.isInteger(day) || day < 1 || day > 7) ||
      !TIME.test(startTime) || !TIME.test(endTime) || startTime >= endTime ||
      !Number.isInteger(slotLengthMinutes) || slotLengthMinutes < 15 || slotLengthMinutes > 480 ||
      !Number.isInteger(familyCapacityPerSlot) || familyCapacityPerSlot < 1 || familyCapacityPerSlot > 20
    ) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid schedule configuration.');
    }

    const template = await withTransaction(async client => {
      if (active) await client.query('UPDATE slot_templates SET active = FALSE, updated_at = NOW()');
      const result = id
        ? await client.query(
          `UPDATE slot_templates
              SET days_of_week = $1, start_time = $2, end_time = $3,
                  slot_length_minutes = $4, family_capacity_per_slot = $5,
                  active = $6, updated_at = NOW()
            WHERE id = $7 RETURNING id`,
          [daysOfWeek, startTime, endTime, slotLengthMinutes, familyCapacityPerSlot, active, id]
        )
        : await client.query(
          `INSERT INTO slot_templates (
             days_of_week, start_time, end_time, slot_length_minutes,
             family_capacity_per_slot, active
           ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [daysOfWeek, startTime, endTime, slotLengthMinutes, familyCapacityPerSlot, active]
        );
      if (!result.rows[0]) throw new HttpError(404, 'SCHEDULE_NOT_FOUND', 'Schedule not found.');

      await client.query(
        `DELETE FROM slots s
          WHERE s.date >= CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status = 'confirmed'
            )`
      );
      return result.rows[0];
    });
    res.status(id ? 200 : 201).json({ id: template.id });
  } catch (error) {
    next(error);
  }
});

router.post('/slots/:slotId/block', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE slots
          SET status = 'blocked', blocked_reason = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, blocked_reason`,
      [typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 500) : null, req.params.slotId]
    );
    if (!result.rows[0]) throw new HttpError(404, 'SLOT_NOT_FOUND', 'Slot not found.');
    res.json({ id: result.rows[0].id, status: result.rows[0].status, reason: result.rows[0].blocked_reason });
  } catch (error) {
    next(error);
  }
});

router.delete('/slots/:slotId/block', async (req, res, next) => {
  try {
    await withTransaction(async client => {
      const result = await client.query('SELECT id FROM slots WHERE id = $1 FOR UPDATE', [req.params.slotId]);
      if (!result.rows[0]) throw new HttpError(404, 'SLOT_NOT_FOUND', 'Slot not found.');
      await client.query(`UPDATE slots SET status = 'open', blocked_reason = NULL WHERE id = $1`, [req.params.slotId]);
      await recalculateSlot(client, req.params.slotId);
    });
    res.json({ id: req.params.slotId, status: 'open' });
  } catch (error) {
    next(error);
  }
});

export default router;
