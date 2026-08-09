export interface VisitorCalendarEvent {
  bookingId: string;
  familyName: string;
  date: string;
  startTime: string;
  endTime: string;
  headcount: number;
  cancellationLink: string;
  cancelled?: boolean;
}

function compactDateTime(date: string, time: string) {
  return `${date.replace(/-/g, '')}T${time.slice(0, 5).replace(':', '')}00`;
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildGoogleCalendarUrl(event: VisitorCalendarEvent) {
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/New_York';
  const location = process.env.GAUSHALA_LOCATION || 'Gaushala';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Gaushala Visit',
    dates: `${compactDateTime(event.date, event.startTime)}/${compactDateTime(event.date, event.endTime)}`,
    ctz: timeZone,
    details: `${event.familyName} · ${event.headcount} ${event.headcount === 1 ? 'visitor' : 'visitors'}\n\nManage booking: ${event.cancellationLink}`,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildCalendarInvite(event: VisitorCalendarEvent) {
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/New_York';
  const location = process.env.GAUSHALA_LOCATION || 'Gaushala';
  const method = event.cancelled ? 'CANCEL' : 'PUBLISH';
  const status = event.cancelled ? 'CANCELLED' : 'CONFIRMED';
  const description = `${event.familyName} · ${event.headcount} ${event.headcount === 1 ? 'visitor' : 'visitors'}\nManage booking: ${event.cancellationLink}`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gaushala Booking App//EN',
    `METHOD:${method}`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.bookingId)}@gaushala-booking-app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;TZID=${escapeIcs(timeZone)}:${compactDateTime(event.date, event.startTime)}`,
    `DTEND;TZID=${escapeIcs(timeZone)}:${compactDateTime(event.date, event.endTime)}`,
    'SUMMARY:Gaushala Visit',
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    `STATUS:${status}`,
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function calendarAttachment(event: VisitorCalendarEvent) {
  return {
    filename: 'gaushala-visit.ics',
    content: Buffer.from(buildCalendarInvite(event), 'utf8').toString('base64'),
  };
}
