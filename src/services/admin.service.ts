import apiClient from './api';
import { Slot } from './slots.service';

export interface AdminBooking {
  id: string;
  familyName: string;
  phone: string;
  email: string;
  headcount: number;
  note?: string;
  status: 'confirmed' | 'cancelled' | 'no_show';
  slotId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AdminSummary {
  todayBookings: number;
  todayVisitors: number;
  upcomingBookings: number;
  cancellations: number;
}

export interface SlotTemplate {
  id?: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotLengthMinutes: number;
  familyCapacityPerSlot: number;
  active: boolean;
}

export async function googleLogin(credential: string) {
  const response = await apiClient.post('/admin/auth/google', { credential });
  return response.data as { token: string; admin: { email: string } };
}

export async function getAdminSummary(): Promise<AdminSummary> {
  return (await apiClient.get('/admin/summary')).data;
}

export async function getAdminBookings(params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<AdminBooking[]> {
  return (await apiClient.get('/admin/bookings', { params })).data.bookings;
}

export async function updateBookingStatus(id: string, status: AdminBooking['status']): Promise<AdminBooking> {
  return (await apiClient.patch(`/admin/bookings/${id}/status`, { status })).data;
}

export async function createAdminBooking(data: {
  slotId: string;
  familyName: string;
  phone: string;
  email: string;
  headcount: number;
  note?: string;
}): Promise<AdminBooking> {
  return (await apiClient.post('/admin/bookings', data)).data;
}

export async function getSlotTemplates(): Promise<SlotTemplate[]> {
  return (await apiClient.get('/admin/slot-templates')).data.templates;
}

export async function getAdminSlots(startDate: string, endDate: string): Promise<Slot[]> {
  return (await apiClient.get('/admin/slots', { params: { startDate, endDate } })).data.slots;
}

export async function saveSlotTemplate(template: SlotTemplate): Promise<{ id: string }> {
  return (await apiClient.post('/admin/slot-templates', template)).data;
}

export async function blockSlot(slotId: string, reason: string) {
  return (await apiClient.post(`/admin/slots/${slotId}/block`, { reason })).data;
}

export async function unblockSlot(slotId: string) {
  return (await apiClient.delete(`/admin/slots/${slotId}/block`)).data;
}

export async function downloadBookingsCsv(params?: { startDate?: string; endDate?: string; status?: string }) {
  const response = await apiClient.get('/admin/bookings/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'gaushala-bookings.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
