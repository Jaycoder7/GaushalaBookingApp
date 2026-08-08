import { PoolClient } from 'pg';
import { query } from '../database/connection';

interface SlotTemplateRow {
  id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  slot_length_minutes: number;
  family_capacity_per_slot: number;
}

export interface SlotRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  family_capacity: number;
  family_bookings_count: number;
  status: 'open' | 'full' | 'blocked' | 'past';
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mondayBasedDay(date: Date): number {
  return ((date.getUTCDay() + 6) % 7) + 1;
}

export async function ensureSlotsGenerated(startDate: string, endDate: string): Promise<void> {
  const templates = await query<SlotTemplateRow>(
    `SELECT id, days_of_week, start_time::text, end_time::text,
            slot_length_minutes, family_capacity_per_slot
       FROM slot_templates
      WHERE active = TRUE`
  );

  for (const template of templates.rows) {
    const cursor = new Date(`${startDate}T00:00:00.000Z`);
    const lastDate = new Date(`${endDate}T00:00:00.000Z`);

    while (cursor <= lastDate) {
      if (template.days_of_week.includes(mondayBasedDay(cursor))) {
        const start = toMinutes(template.start_time);
        const end = toMinutes(template.end_time);

        for (let slotStart = start; slotStart + template.slot_length_minutes <= end; slotStart += template.slot_length_minutes) {
          await query(
            `INSERT INTO slots (
               template_id, date, start_time, end_time, family_capacity
             ) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (date, start_time, end_time) DO NOTHING`,
            [
              template.id,
              isoDate(cursor),
              toTime(slotStart),
              toTime(slotStart + template.slot_length_minutes),
              template.family_capacity_per_slot,
            ]
          );
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
}

export function publicSlot(row: SlotRow) {
  return {
    id: row.id,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    familyCapacity: row.family_capacity,
    familyBookingsCount: row.family_bookings_count,
    remainingCapacity: Math.max(0, row.family_capacity - row.family_bookings_count),
    status: row.status,
  };
}

export async function recalculateSlot(client: PoolClient, slotId: string): Promise<void> {
  await client.query(
    `UPDATE slots s
        SET family_bookings_count = counts.total,
            status = CASE
              WHEN s.status = 'blocked' THEN 'blocked'
              WHEN s.date < CURRENT_DATE THEN 'past'
              WHEN counts.total >= s.family_capacity THEN 'full'
              ELSE 'open'
            END,
            updated_at = NOW()
       FROM (
         SELECT $1::uuid AS slot_id, COUNT(*)::int AS total
           FROM bookings
          WHERE slot_id = $1 AND status = 'confirmed'
       ) counts
      WHERE s.id = counts.slot_id`,
    [slotId]
  );
}
