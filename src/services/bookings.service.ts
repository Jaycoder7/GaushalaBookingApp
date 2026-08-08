import apiClient from './api';

export interface BookingRequest {
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
  status: string;
  cancellationToken: string;
  cancellationLink: string;
}

export interface BookingDetails {
  id: string;
  familyName: string;
  phone: string;
  email: string;
  headcount: number;
  note?: string;
  slotDate: string;
  slotTime: string;
  slotEndTime?: string;
  status: string;
}

export async function createBooking(data: BookingRequest): Promise<BookingResponse> {
  const response = await apiClient.post('/bookings', data);
  return response.data;
}

export async function getBooking(cancellationToken: string): Promise<BookingDetails> {
  const response = await apiClient.get(`/bookings/${cancellationToken}`);
  return response.data;
}

export async function cancelBooking(cancellationToken: string) {
  const response = await apiClient.delete(`/bookings/${cancellationToken}`);
  return response.data;
}
