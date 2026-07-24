// Slot Types
export interface SlotTemplate {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotLengthMinutes: number;
  familyCapacityPerSlot: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Slot {
  id: string;
  templateId?: string;
  date: string;
  startTime: string;
  endTime: string;
  familyCapacity: number;
  familyBookingsCount: number;
  status: SlotStatus;
  googleCalendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SlotStatus = 'open' | 'full' | 'blocked' | 'past';

// Booking Types
export interface Booking {
  id: string;
  slotId: string;
  familyName: string;
  phone: string;
  email: string;
  headcount: number;
  note?: string;
  status: BookingStatus;
  cancellationToken: string;
  createdAt: Date;
  cancelledAt?: Date;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'no_show';

export interface CreateBookingRequest {
  slotId: string;
  familyName: string;
  phone: string;
  email: string;
  headcount: number;
  note?: string;
  captchaToken: string;
}

export interface BookingResponse {
  id: string;
  status: BookingStatus;
  cancellationToken: string;
  cancellationLink: string;
}

// Admin Types
export interface AdminUser {
  id: string;
  googleAccountEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminAuthPayload {
  email: string;
  sub: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Error Types
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Booking errors
  SLOT_FULL: 'SLOT_FULL',
  DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',
  SLOT_NOT_FOUND: 'SLOT_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  INVALID_BOOKING_DATA: 'INVALID_BOOKING_DATA',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CAPTCHA_FAILED: 'CAPTCHA_FAILED',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
};
