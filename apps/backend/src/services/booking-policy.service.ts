export function bookingPhoneRateLimitKey(slotId: unknown, phone: unknown): string {
  const normalizedSlotId = typeof slotId === 'string' && slotId.trim()
    ? slotId.trim().toLowerCase()
    : 'invalid-slot';
  const normalizedPhone = typeof phone === 'string' && phone.trim()
    ? phone.trim()
    : 'invalid-phone';

  return `${normalizedSlotId}:${normalizedPhone}`;
}
