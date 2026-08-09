import { bookingPhoneRateLimitKey } from './booking-policy.service';

describe('booking policy', () => {
  it('keeps the same phone independent across different slots', () => {
    const firstSlot = bookingPhoneRateLimitKey(
      '00000000-0000-4000-8000-000000000001',
      '+15555550100'
    );
    const secondSlot = bookingPhoneRateLimitKey(
      '00000000-0000-4000-8000-000000000002',
      '+15555550100'
    );

    expect(firstSlot).not.toBe(secondSlot);
  });

  it('normalizes harmless whitespace and slot casing', () => {
    expect(bookingPhoneRateLimitKey(' ABC-123 ', ' +15555550100 '))
      .toBe(bookingPhoneRateLimitKey('abc-123', '+15555550100'));
  });
});
