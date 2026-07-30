import express from 'express';
import rateLimit from 'express-rate-limit';
import { QueryResultRow } from 'pg';
import { withTransaction } from '../database/connection';
import { HttpError } from '../errors';
import { validateBookingInput } from '../middleware/validation.middleware';
import { verifyCaptcha } from '../services/captcha.service';
import { queueCalendarSync } from '../services/calendar.service';
import { emailTemplates, sendEmail } from '../services/email.service';
import { sendSMS } from '../services/sms.service';
import { recalculateSlot } from '../services/slots.service';

const router = express.Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface BookingRow extends QueryResultRow {
  id: string;
  cancellation_token: string;
  family_name: string;
  phone: string;
  email: string;
  headcount: number;
  note: string | null;
  status: 'confirmed' | 'cancelled' | 'no_show';
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

const bookingLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many booking attempts. Please try again in a few minutes.', code: 'RATE_LIMITED' },
});

const phoneLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: req => String(req.body.phone),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many bookings from this phone number. Please try again later.', code: 'RATE_LIMITED' },
});

function bookingDetails(row: BookingRow) {
  return {
    id: row.id,
    familyName: row.family_name,
    phone: row.phone,
    email: row.email,
    headcount: row.headcount,
    note: row.note || undefined,
    slotDate: row.date,
    slotTime: row.start_time.slice(0, 5),
    slotEndTime: row.end_time.slice(0, 5),
    status: row.status,
  };
}

async function sendConfirmation(row: BookingRow, cancellationLink: string): Promise<void> {
  const tasks: Promise<unknown>[] = [
    sendEmail({
      to: row.email,
      subject: 'Your Gaushala visit is confirmed',
      html: emailTemplates.bookingConfirmation(
        row.family_name,
        row.date,
        row.start_time.slice(0, 5),
        cancellationLink
      ),
    }),
    sendSMS({
      to: row.phone,
      message: `Your Gaushala visit is confirmed for ${row.date} at ${row.start_time.slice(0, 5)}.`,
    }),
  ];

  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    tasks.push(sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: 'New Gaushala visit booking',
      html: emailTemplates.adminNotification(
        row.family_name,
        row.phone,
        row.headcount,
        row.date,
        row.start_time.slice(0, 5)
      ),
    }));
  }

  const results = await Promise.allSettled(tasks);
  results.filter(result => result.status === 'rejected').forEach(result => {
    console.error('Booking notification failed:', (result as PromiseRejectedResult).reason);
  });
}

async function sendCancellationConfirmation(row: BookingRow): Promise<void> {
  const subject = 'Your Gaushala visit has been cancelled';
  const html = emailTemplates.cancellationConfirmation(
    row.family_name,
    row.date,
    row.start_time.slice(0, 5)
  );
  const tasks: Promise<unknown>[] = [
    sendEmail({ to: row.email, subject, html }),
    sendSMS({
      to: row.phone,
      message: `Your Gaushala visit for ${row.date} at ${row.start_time.slice(0, 5)} has been cancelled.`,
    }),
  ];
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    tasks.push(sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: `Cancelled: ${row.family_name} Gaushala visit`,
      html,
    }));
  }
  await Promise.allSettled(tasks);
}

// POST /api/bookings - Create a booking
router.post('/', bookingLimiter, validateBookingInput, phoneLimiter, async (req, res, next) => {
  try {
    const { slotId, familyName, phone, email, headcount, note, captchaToken } = req.body;

    if (!captchaToken || typeof captchaToken !== 'string') {
      throw new HttpError(400, 'CAPTCHA_FAILED', 'Please complete the CAPTCHA challenge.');
    }
    if (!(await verifyCaptcha(captchaToken, req.ip))) {
      throw new HttpError(400, 'CAPTCHA_FAILED', 'CAPTCHA verification failed. Please try again.');
    }

    const booking = await withTransaction(async client => {
      const slotResult = await client.query<QueryResultRow>(
        `SELECT id, date::text, start_time::text, end_time::text,
                family_capacity, family_bookings_count, status
           FROM slots
          WHERE id = $1
          FOR UPDATE`,
        [slotId]
      );
      const slot = slotResult.rows[0];
      if (!slot) throw new HttpError(404, 'SLOT_NOT_FOUND', 'The selected time slot no longer exists.');
      if (slot.date < new Date().toISOString().slice(0, 10) || slot.status === 'past') {
        throw new HttpError(409, 'SLOT_UNAVAILABLE', 'The selected time slot is in the past.');
      }
      if (slot.status === 'blocked') {
        throw new HttpError(409, 'SLOT_UNAVAILABLE', 'The selected time slot is unavailable.');
      }
      if (slot.family_bookings_count >= slot.family_capacity || slot.status === 'full') {
        throw new HttpError(409, 'SLOT_FULL', 'The selected time slot is full.');
      }

      const duplicate = await client.query(
        `SELECT 1
           FROM bookings
          WHERE slot_id = $1
            AND status = 'confirmed'
            AND (phone = $2 OR LOWER(email) = LOWER($3))
          LIMIT 1`,
        [slotId, phone.trim(), email.trim()]
      );
      if (duplicate.rowCount) {
        throw new HttpError(409, 'DUPLICATE_BOOKING', 'This phone number or email already has a booking for that slot.');
      }

      const inserted = await client.query<BookingRow>(
        `INSERT INTO bookings (slot_id, family_name, phone, email, headcount, note)
         VALUES ($1, $2, $3, LOWER($4), $5, $6)
         RETURNING id, cancellation_token, family_name, phone, email, headcount,
                   note, status, slot_id`,
        [
          slotId,
          familyName.trim(),
          phone.trim(),
          email.trim(),
          headcount,
          typeof note === 'string' && note.trim() ? note.trim() : null,
        ]
      );
      await recalculateSlot(client, slotId);

      return {
        ...inserted.rows[0],
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      } as BookingRow;
    });

    const appUrl = (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
    const cancellationLink = `${appUrl}/cancel/${booking.cancellation_token}`;
    void sendConfirmation(booking, cancellationLink);
    queueCalendarSync(booking.slot_id);

    res.status(201).json({
      id: booking.id,
      status: booking.status,
      cancellationToken: booking.cancellation_token,
      cancellationLink,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:cancellationToken - Get booking by cancellation token
router.get('/:cancellationToken', async (req, res, next) => {
  try {
    if (!UUID.test(req.params.cancellationToken)) {
      throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    }
    const result = await withTransaction(client => client.query<BookingRow>(
      `SELECT b.id, b.cancellation_token, b.family_name, b.phone, b.email,
              b.headcount, b.note, b.status, b.slot_id,
              s.date::text, s.start_time::text, s.end_time::text
         FROM bookings b
         JOIN slots s ON s.id = b.slot_id
        WHERE b.cancellation_token = $1`,
      [req.params.cancellationToken]
    ));
    if (!result.rows[0]) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    res.json(bookingDetails(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/bookings/:cancellationToken - Cancel booking
router.delete('/:cancellationToken', bookingLimiter, async (req, res, next) => {
  try {
    if (!UUID.test(req.params.cancellationToken)) {
      throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    }

    const result = await withTransaction(async client => {
      const result = await client.query<BookingRow>(
        `SELECT b.id, b.cancellation_token, b.family_name, b.phone, b.email,
                b.headcount, b.note, b.status, b.slot_id,
                s.date::text, s.start_time::text, s.end_time::text
           FROM bookings b
           JOIN slots s ON s.id = b.slot_id
          WHERE b.cancellation_token = $1
          FOR UPDATE OF b, s`,
        [req.params.cancellationToken]
      );
      const row = result.rows[0];
      if (!row) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
      if (row.status === 'cancelled') return { booking: row, cancelledNow: false };

      await client.query(
        `UPDATE bookings
            SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [row.id]
      );
      await recalculateSlot(client, row.slot_id);
      return { booking: { ...row, status: 'cancelled' as const }, cancelledNow: true };
    });

    if (result.cancelledNow) {
      queueCalendarSync(result.booking.slot_id);
      void sendCancellationConfirmation(result.booking);
    }
    res.json({
      ...bookingDetails(result.booking),
      message: result.cancelledNow ? 'Booking cancelled successfully.' : 'Booking was already cancelled.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
