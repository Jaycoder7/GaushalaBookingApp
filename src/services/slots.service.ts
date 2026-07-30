import apiClient from './api';

export interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  familyCapacity: number;
  familyBookingsCount: number;
  status: 'open' | 'full' | 'blocked' | 'past';
}

export async function getAvailableSlots(startDate: string, endDate: string): Promise<Slot[]> {
  const response = await apiClient.get('/slots', {
    params: { startDate, endDate },
  });
  return response.data.slots;
}
