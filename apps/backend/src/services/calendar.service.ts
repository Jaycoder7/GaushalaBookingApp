import { google } from 'googleapis';
import { query } from '../database/connection';

interface CalendarSlotRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  google_calendar_event_id: string | null;
}

interface CalendarBookingRow {
  family_name: string;
  headcount: number;
  phone: string;
}

function calendarClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALENDAR_REFRESH_TOKEN) {
    throw new Error('Google Calendar credentials are not configured');
  }
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_CALENDAR_REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth });
}

export async function syncSlotToCalendar(slotId: string): Promise<void> {
  const calendar = calendarClient();

  const [slotResult, bookingsResult] = await Promise.all([
    query<CalendarSlotRow>(
      `SELECT id, date::text, start_time::text, end_time::text, google_calendar_event_id
         FROM slots WHERE id = $1`,
      [slotId]
    ),
    query<CalendarBookingRow>(
      `SELECT family_name, headcount, phone
         FROM bookings
        WHERE slot_id = $1 AND status = 'confirmed'
        ORDER BY created_at`,
      [slotId]
    ),
  ]);
  const slot = slotResult.rows[0];
  if (!slot) return;

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  if (bookingsResult.rows.length === 0) {
    if (slot.google_calendar_event_id) {
      await calendar.events.delete({ calendarId, eventId: slot.google_calendar_event_id });
      await query('UPDATE slots SET google_calendar_event_id = NULL WHERE id = $1', [slot.id]);
    }
    return;
  }

  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/New_York';
  const description = bookingsResult.rows
    .map(booking => `${booking.family_name} — ${booking.headcount} visitor${booking.headcount === 1 ? '' : 's'} — ${booking.phone}`)
    .join('\n');
  const event = {
    summary: `Gaushala visits (${bookingsResult.rows.length} families)`,
    description,
    start: { dateTime: `${slot.date}T${slot.start_time.slice(0, 5)}:00`, timeZone },
    end: { dateTime: `${slot.date}T${slot.end_time.slice(0, 5)}:00`, timeZone },
  };

  if (slot.google_calendar_event_id) {
    await calendar.events.update({ calendarId, eventId: slot.google_calendar_event_id, requestBody: event });
  } else {
    const created = await calendar.events.insert({ calendarId, requestBody: event });
    if (created.data.id) {
      await query(
        'UPDATE slots SET google_calendar_event_id = $1, updated_at = NOW() WHERE id = $2',
        [created.data.id, slot.id]
      );
    }
  }
}
