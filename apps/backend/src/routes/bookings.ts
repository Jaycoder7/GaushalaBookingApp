import express from 'express';
import { QueryResultRow } from 'pg';
import { withTransaction } from '../database/connection';
import { HttpError } from '../errors';
import { validateBookingInput } from '../middleware/validation.middleware';
import { verifyCaptcha } from '../services/captcha.service';
import { bookingPhoneRateLimitKey } from '../services/booking-policy.service';
import { buildGoogleCalendarUrl, calendarAttachment, VisitorCalendarEvent } from '../services/calendar-invite.service';
import { emailTemplates } from '../services/email.service';
import { dispatchBackgroundJobs, enqueueBackgroundJob } from '../services/jobs.service';
import { databaseRateLimit } from '../services/rate-limit.service';
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
  referred_by: string | null;
  is_donor: boolean;
  is_volunteer: boolean;
  visit_location: string;
  note: string | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'no_show';
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

const bookingLimiter = databaseRateLimit({
  scope: 'booking-ip',
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  key: req => req.ip || 'unknown',
  message: 'Too many booking attempts. Please try again in a few minutes.',
});

const phoneLimiter = databaseRateLimit({
  scope: 'booking-phone',
  windowMs: 60 * 60 * 1000,
  limit: 5,
  key: req => bookingPhoneRateLimitKey(req.body?.slotId, req.body?.phone),
  message: 'Too many booking attempts for this phone number and time slot. Please try again later.',
});

function visitorCalendarEvent(row: BookingRow, cancellationLink: string, cancelled = false): VisitorCalendarEvent {
  return {
    bookingId: row.id,
    familyName: row.family_name,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    headcount: row.headcount,
    cancellationLink,
    cancelled,
  };
}

function bookingDetails(row: BookingRow) {
  const appUrl = (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
  const cancellationLink = `${appUrl}/cancel/${row.cancellation_token}`;
  return {
    id: row.id,
    familyName: row.family_name,
    phone: row.phone,
    email: row.email,
    headcount: row.headcount,
    referredBy: row.referred_by || undefined,
    isDonor: row.is_donor,
    isVolunteer: row.is_volunteer,
    visitLocation: row.visit_location,
    note: row.note || undefined,
    slotDate: row.date,
    slotTime: row.start_time.slice(0, 5),
    slotEndTime: row.end_time.slice(0, 5),
    status: row.status,
    ...(row.status === 'confirmed'
      ? {
          calendarLink: buildGoogleCalendarUrl(visitorCalendarEvent(row, cancellationLink)),
          visitAddress: '1945 Old Atlanta Rd, Cumming, GA 30041',
          parkingAddress: '3100-3660 Melody Mizer Ln, Cumming, GA 30041',
        }
      : {}),
  };
}

// POST /api/bookings - Create a booking
router.post('/', bookingLimiter, validateBookingInput, phoneLimiter, async (req, res, next) => {
  try {
    const {
      slotId, familyName, phone, email, headcount, referredBy,
      isDonor, isVolunteer, visitLocation, note, captchaToken,
    } = req.body;

    if (!captchaToken || typeof captchaToken !== 'string') {
      throw new HttpError(400, 'CAPTCHA_FAILED', 'Please complete the CAPTCHA challenge.');
    }
    if (!(await verifyCaptcha(captchaToken, req.ip))) {
      throw new HttpError(400, 'CAPTCHA_FAILED', 'CAPTCHA verification failed. Please try again.');
    }

    const appUrl = (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
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
            AND status IN ('pending', 'confirmed')
            AND (phone = $2 OR LOWER(email) = LOWER($3))
          LIMIT 1`,
        [slotId, phone.trim(), email.trim()]
      );
      if (duplicate.rowCount) {
        throw new HttpError(409, 'DUPLICATE_BOOKING', 'This phone number or email already has a booking for that slot.');
      }

      const inserted = await client.query<BookingRow>(
        `INSERT INTO bookings (
           slot_id, family_name, phone, email, headcount, referred_by,
           is_donor, is_volunteer, visit_location, note, status
         )
         VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8, $9, $10, 'pending')
         RETURNING id, cancellation_token, family_name, phone, email, headcount,
                   referred_by, is_donor, is_volunteer, visit_location,
                   note, status, slot_id`,
        [
          slotId,
          familyName.trim(),
          phone.trim(),
          email.trim(),
          headcount,
          referredBy.trim(),
          isDonor,
          isVolunteer,
          visitLocation,
          typeof note === 'string' && note.trim() ? note.trim() : null,
        ]
      );
      await recalculateSlot(client, slotId);
      const row = {
        ...inserted.rows[0],
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      } as BookingRow;
      const cancellationLink = `${appUrl}/cancel/${row.cancellation_token}`;
      await enqueueBackgroundJob(client, 'email', {
        to: row.email,
        subject: 'Your Gaushala visit request was received',
        html: emailTemplates.bookingPending(row.family_name, row.date, row.start_time.slice(0, 5), cancellationLink),
      }, { dedupeKey: `booking-pending:${row.id}`, maxAttempts: 20 });
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await enqueueBackgroundJob(client, 'email', {
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject: 'Gaushala visit request needs approval',
          html: emailTemplates.adminNotification(row.family_name, row.phone, row.headcount, row.date, row.start_time.slice(0, 5)),
        }, { dedupeKey: `booking-admin:${row.id}`, maxAttempts: 20 });
      }
      return row;
    });

    const cancellationLink = `${appUrl}/cancel/${booking.cancellation_token}`;
    res.status(201).json({
      id: booking.id,
      status: booking.status,
      cancellationToken: booking.cancellation_token,
      cancellationLink,
      manageLink: `${appUrl}/booking/${booking.cancellation_token}`,
      message: 'Your visit request is awaiting admin approval.',
    });
    dispatchBackgroundJobs(1);
  } catch (error: any) {
    if (error?.code === '23505') {
      next(new HttpError(409, 'DUPLICATE_BOOKING', 'This phone number or email already has a booking for that slot.'));
      return;
    }
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
              b.headcount, b.referred_by, b.is_donor, b.is_volunteer,
              b.visit_location, b.note, b.status, b.slot_id,
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
                b.headcount, b.referred_by, b.is_donor, b.is_volunteer,
                b.visit_location, b.note, b.status, b.slot_id,
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
      const booking = { ...row, status: 'cancelled' as const };
      const subject = 'Your Gaushala visit has been cancelled';
      const html = emailTemplates.cancellationConfirmation(booking.family_name, booking.date, booking.start_time.slice(0, 5));
      const appUrl = (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
      const cancellationLink = `${appUrl}/cancel/${booking.cancellation_token}`;
      const wasConfirmed = row.status === 'confirmed';
      const cancelledEvent = visitorCalendarEvent(booking, cancellationLink, true);
      await enqueueBackgroundJob(client, 'email', {
        to: booking.email,
        subject,
        html,
        ...(wasConfirmed ? { attachments: [calendarAttachment(cancelledEvent)] } : {}),
      }, {
        dedupeKey: `booking-cancelled:${booking.id}`,
        maxAttempts: 20,
      });
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await enqueueBackgroundJob(client, 'email', {
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject: `Cancelled: ${booking.family_name} Gaushala visit`,
          html,
        }, { dedupeKey: `booking-cancelled-admin:${booking.id}`, maxAttempts: 20 });
      }
      if (wasConfirmed) {
        await enqueueBackgroundJob(client, 'calendar_sync', { slotId: booking.slot_id }, {
          dedupeKey: `calendar:${booking.slot_id}`,
          maxAttempts: 100,
        });
      }
      return { booking, cancelledNow: true };
    });

    if (result.cancelledNow) {
      void sendSMS({
        to: result.booking.phone,
        message: `Your Gaushala visit for ${result.booking.date} at ${result.booking.start_time.slice(0, 5)} has been cancelled.`,
      }).catch(error => console.error('SMS notification failed:', error));
      dispatchBackgroundJobs(1);
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
