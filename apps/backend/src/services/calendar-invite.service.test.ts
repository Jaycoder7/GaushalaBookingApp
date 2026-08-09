import { buildCalendarInvite, buildGoogleCalendarUrl, calendarAttachment } from './calendar-invite.service';

const event = {
  bookingId: '00000000-0000-4000-8000-000000000001',
  familyName: 'Patel family',
  date: '2030-08-12',
  startTime: '09:00',
  endTime: '10:00',
  headcount: 4,
  cancellationLink: 'https://example.com/cancel/token',
};

describe('visitor calendar invites', () => {
  it('builds a timezone-aware Google Calendar template link', () => {
    const url = new URL(buildGoogleCalendarUrl(event));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20300812T090000/20300812T100000');
    expect(url.searchParams.get('ctz')).toBe('America/New_York');
    expect(url.searchParams.get('details')).toContain('Patel family');
  });

  it('builds a private ICS attachment with a stable booking UID', () => {
    const invite = buildCalendarInvite(event);
    expect(invite).toContain('UID:00000000-0000-4000-8000-000000000001@gaushala-booking-app');
    expect(invite).toContain('DTSTART;TZID=America/New_York:20300812T090000');
    expect(Buffer.from(calendarAttachment(event).content, 'base64').toString('utf8')).toBe(invite);
  });

  it('marks a cancellation invite correctly', () => {
    const invite = buildCalendarInvite({ ...event, cancelled: true });
    expect(invite).toContain('METHOD:CANCEL');
    expect(invite).toContain('STATUS:CANCELLED');
  });
});
