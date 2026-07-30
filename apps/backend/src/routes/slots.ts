import express from 'express';
import { query } from '../database/connection';
import { HttpError } from '../errors';
import { ensureSlotsGenerated, publicSlot, SlotRow } from '../services/slots.service';

const router = express.Router();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/slots - Get available slots
router.get('/', async (req, res, next) => {
  try {
    const today = new Date();
    const defaultEnd = new Date(today);
    defaultEnd.setUTCDate(defaultEnd.getUTCDate() + 29);

    const startDate = typeof req.query.startDate === 'string'
      ? req.query.startDate
      : today.toISOString().slice(0, 10);
    const endDate = typeof req.query.endDate === 'string'
      ? req.query.endDate
      : defaultEnd.toISOString().slice(0, 10);

    if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Dates must use YYYY-MM-DD format.');
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000);
    if (Number.isNaN(days) || days < 0 || days > 60) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Date range must be between 0 and 60 days.');
    }

    await ensureSlotsGenerated(startDate, endDate);
    const slots = await query<SlotRow>(
      `SELECT id, date::text, start_time::text, end_time::text,
              family_capacity, family_bookings_count,
              CASE
                WHEN status = 'blocked' THEN 'blocked'
                WHEN date < CURRENT_DATE THEN 'past'
                WHEN family_bookings_count >= family_capacity THEN 'full'
                ELSE 'open'
              END AS status
         FROM slots
        WHERE date BETWEEN $1 AND $2
          AND status <> 'blocked'
        ORDER BY date, start_time`,
      [startDate, endDate]
    );

    res.json({ slots: slots.rows.map(publicSlot) });
  } catch (error) {
    next(error);
  }
});

export default router;
