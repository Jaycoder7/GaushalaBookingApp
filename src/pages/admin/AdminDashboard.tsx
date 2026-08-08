import axios from 'axios';
import { addDays, format, parseISO } from 'date-fns';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminBooking,
  AdminSummary,
  blockDate,
  blockSlot,
  createAdminBooking,
  downloadBookingsCsv,
  getAdminBookings,
  getAdminSlots,
  getAdminSummary,
  getSlotTemplates,
  saveSlotTemplate,
  SlotTemplate,
  unblockSlot,
  unblockDate,
  updateAdminBooking,
  updateBookingStatus,
} from '../../services/admin.service';
import { Slot } from '../../services/slots.service';
import { formatSlotTime } from '../../utils/formatting';

type Tab = 'bookings' | 'schedule' | 'blocking';

const defaultSchedule: SlotTemplate = {
  daysOfWeek: [1, 2, 3, 4, 5, 6],
  startTime: '09:00',
  endTime: '17:00',
  slotLengthMinutes: 60,
  familyCapacityPerSlot: 6,
  active: true,
};

function messageFrom(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  return 'The request could not be completed.';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('bookings');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [schedule, setSchedule] = useState<SlotTemplate>(defaultSchedule);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);
  const [blockDay, setBlockDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    slotId: '', familyName: '', phone: '', email: '', headcount: 1, note: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const adminEmail = localStorage.getItem('admin_email') || 'Administrator';

  const signOut = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin', { replace: true });
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const [summaryData, bookingData, templates, slotData] = await Promise.all([
        getAdminSummary(),
        getAdminBookings({
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(startDateFilter ? { startDate: startDateFilter } : {}),
          ...(endDateFilter ? { endDate: endDateFilter } : {}),
        }),
        getSlotTemplates(),
        getAdminSlots(startDate, endDate),
      ]);
      setSummary(summaryData);
      setBookings(bookingData);
      setSchedule(templates.find(template => template.active) || defaultSchedule);
      setSlots(slotData);
    } catch (loadError) {
      if (axios.isAxiosError(loadError) && loadError.response?.status === 401) {
        signOut();
        return;
      }
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, [endDateFilter, signOut, startDateFilter, statusFilter]);

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin', { replace: true });
      return;
    }
    void load();
  }, [load, navigate]);

  const changeStatus = async (booking: AdminBooking, status: AdminBooking['status']) => {
    setError('');
    try {
      const updated = await updateBookingStatus(booking.id, status);
      setBookings(current => current.map(item => item.id === updated.id ? updated : item));
      setNotice(`Booking marked ${status.replace('_', ' ')}.`);
      setSummary(await getAdminSummary());
    } catch (updateError) {
      setError(messageFrom(updateError));
    }
  };

  const createManualBooking = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAdminBooking(manualBooking);
      setManualBooking({ slotId: '', familyName: '', phone: '', email: '', headcount: 1, note: '' });
      setShowManualBooking(false);
      setNotice('Manual booking created.');
      await load();
    } catch (createError) {
      setError(messageFrom(createError));
    } finally {
      setSaving(false);
    }
  };

  const saveBookingEdits = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingBooking) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateAdminBooking(editingBooking.id, editingBooking);
      setBookings(current => current.map(item => item.id === updated.id ? updated : item));
      setEditingBooking(null);
      setNotice('Booking details updated.');
    } catch (updateError) {
      setError(messageFrom(updateError));
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await saveSlotTemplate(schedule);
      setSchedule(current => ({ ...current, id: result.id }));
      setNotice('Schedule saved. New availability will use these hours.');
      await load();
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (slot: Slot) => {
    setError('');
    try {
      if (slot.status === 'blocked') {
        await unblockSlot(slot.id);
      } else {
        const reason = window.prompt('Reason for blocking this time (optional):', '') ?? '';
        const result = await blockSlot(slot.id, reason);
        if (result.followUpRequired) {
          setNotice(`Visit time blocked. Follow up with ${result.confirmedBookings} confirmed ${result.confirmedBookings === 1 ? 'family' : 'families'} already booked in this time.`);
          await load();
          return;
        }
      }
      setNotice(slot.status === 'blocked' ? 'Visit time reopened.' : 'Visit time blocked.');
      await load();
    } catch (blockError) {
      setError(messageFrom(blockError));
    }
  };

  const blockWholeDay = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await blockDate(blockDay, blockReason);
      setNotice(result.followUpRequired
        ? `Date blocked. Follow up with ${result.confirmedBookings} confirmed ${result.confirmedBookings === 1 ? 'family' : 'families'} across ${result.affectedSlots} visit times.`
        : `Date blocked across ${result.affectedSlots} visit times.`);
      setBlockReason('');
      await load();
    } catch (blockError) {
      setError(messageFrom(blockError));
    } finally {
      setSaving(false);
    }
  };

  const reopenWholeDay = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await unblockDate(blockDay);
      setNotice(`Reopened ${result.affectedSlots} visit times on ${blockDay}.`);
      await load();
    } catch (blockError) {
      setError(messageFrom(blockError));
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setSchedule(current => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter(value => value !== day)
        : [...current.daysOfWeek, day].sort(),
    }));
  };

  const stats = [
    ['Today’s bookings', summary?.todayBookings ?? 0],
    ['Today’s visitors', summary?.todayVisitors ?? 0],
    ['Upcoming bookings', summary?.upcomingBookings ?? 0],
    ['Cancellations', summary?.cancellations ?? 0],
  ];

  return (
    <main className="min-h-screen bg-earth-50">
      <header className="border-b border-earth-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron-600">Gaushala</p>
            <h1 className="text-xl font-bold">Visit administration</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-earth-700 sm:block">{adminEmail}</span>
            <button onClick={signOut} className="rounded-xl border border-earth-100 px-4 py-2 text-sm font-semibold hover:bg-earth-50">Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-soft">
              <p className="text-sm text-earth-700">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <nav className="mt-8 flex gap-2 overflow-x-auto border-b border-earth-100">
          {([
            ['bookings', 'Bookings'],
            ['schedule', 'Weekly schedule'],
            ['blocking', 'Block availability'],
          ] as [Tab, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${
                tab === value ? 'border-saffron-500 text-saffron-700' : 'border-transparent text-earth-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}

        {tab === 'bookings' && (
          <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-earth-100 p-5">
              <div>
                <h2 className="text-xl font-bold">All bookings</h2>
                <p className="mt-1 text-sm text-earth-700">{bookings.length} records</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowManualBooking(current => !current)} className="rounded-xl border border-saffron-500 px-4 py-2 text-sm font-bold text-saffron-700">
                  {showManualBooking ? 'Close form' : 'New booking'}
                </button>
                <select
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-earth-100 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No-show</option>
                </select>
                <label className="text-xs font-semibold text-earth-700">From
                  <input type="date" value={startDateFilter} onChange={event => setStartDateFilter(event.target.value)} className="ml-2 rounded-xl border border-earth-100 bg-white px-3 py-2 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-earth-700">To
                  <input type="date" value={endDateFilter} onChange={event => setEndDateFilter(event.target.value)} className="ml-2 rounded-xl border border-earth-100 bg-white px-3 py-2 text-sm font-normal" />
                </label>
                <button onClick={() => void downloadBookingsCsv({
                  ...(statusFilter ? { status: statusFilter } : {}),
                  ...(startDateFilter ? { startDate: startDateFilter } : {}),
                  ...(endDateFilter ? { endDate: endDateFilter } : {}),
                })} className="rounded-xl bg-earth-900 px-4 py-2 text-sm font-bold text-white">
                  Export CSV
                </button>
              </div>
            </div>
            {showManualBooking && (
              <form onSubmit={createManualBooking} className="border-b border-earth-100 bg-saffron-50/40 p-5">
                <h3 className="font-bold">Create a phone-in booking</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <select required value={manualBooking.slotId} onChange={event => setManualBooking({ ...manualBooking, slotId: event.target.value })} className="rounded-xl border border-earth-100 bg-white px-3 py-2.5 text-sm">
                    <option value="">Choose visit time</option>
                    {slots.filter(slot => slot.status === 'open').map(slot => (
                      <option key={slot.id} value={slot.id}>{format(parseISO(slot.date), 'MMM d')} · {formatSlotTime(slot.startTime, slot.endTime)}</option>
                    ))}
                  </select>
                  <input required minLength={2} placeholder="Family name" value={manualBooking.familyName} onChange={event => setManualBooking({ ...manualBooking, familyName: event.target.value })} className="rounded-xl border border-earth-100 px-3 py-2.5 text-sm" />
                  <input required type="tel" placeholder="+15551234567" value={manualBooking.phone} onChange={event => setManualBooking({ ...manualBooking, phone: event.target.value })} className="rounded-xl border border-earth-100 px-3 py-2.5 text-sm" />
                  <input required type="email" placeholder="Email address" value={manualBooking.email} onChange={event => setManualBooking({ ...manualBooking, email: event.target.value })} className="rounded-xl border border-earth-100 px-3 py-2.5 text-sm" />
                  <select value={manualBooking.headcount} onChange={event => setManualBooking({ ...manualBooking, headcount: Number(event.target.value) })} className="rounded-xl border border-earth-100 bg-white px-3 py-2.5 text-sm">
                    {[1, 2, 3, 4, 5, 6].map(count => <option key={count} value={count}>{count} {count === 1 ? 'visitor' : 'visitors'}</option>)}
                  </select>
                  <input placeholder="Note (optional)" value={manualBooking.note} onChange={event => setManualBooking({ ...manualBooking, note: event.target.value })} className="rounded-xl border border-earth-100 px-3 py-2.5 text-sm" />
                </div>
                <button disabled={saving} className="mt-4 rounded-xl bg-saffron-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {saving ? 'Creating…' : 'Create booking'}
                </button>
              </form>
            )}
            {loading ? (
              <div className="p-8 text-center text-earth-700">Loading bookings…</div>
            ) : bookings.length === 0 ? (
              <div className="p-8 text-center text-earth-700">No bookings match this view.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-earth-50 text-xs uppercase tracking-wide text-earth-700">
                    <tr>
                      <th className="px-5 py-3">Visit</th><th className="px-5 py-3">Family</th>
                      <th className="px-5 py-3">Contact</th><th className="px-5 py-3">Visitors</th>
                      <th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-100">
                    {bookings.map(booking => editingBooking?.id === booking.id ? (
                      <tr key={booking.id}>
                        <td colSpan={6} className="bg-saffron-50/40 px-5 py-4">
                          <form onSubmit={saveBookingEdits} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                            <input required minLength={2} aria-label="Family name" value={editingBooking.familyName} onChange={event => setEditingBooking({ ...editingBooking, familyName: event.target.value })} className="rounded-lg border border-earth-100 px-3 py-2" />
                            <input required type="tel" aria-label="Phone" value={editingBooking.phone} onChange={event => setEditingBooking({ ...editingBooking, phone: event.target.value })} className="rounded-lg border border-earth-100 px-3 py-2" />
                            <input required type="email" aria-label="Email" value={editingBooking.email} onChange={event => setEditingBooking({ ...editingBooking, email: event.target.value })} className="rounded-lg border border-earth-100 px-3 py-2" />
                            <input required type="number" min={1} max={6} aria-label="Visitors" value={editingBooking.headcount} onChange={event => setEditingBooking({ ...editingBooking, headcount: Number(event.target.value) })} className="rounded-lg border border-earth-100 px-3 py-2" />
                            <input aria-label="Note" placeholder="Note" value={editingBooking.note || ''} onChange={event => setEditingBooking({ ...editingBooking, note: event.target.value })} className="rounded-lg border border-earth-100 px-3 py-2" />
                            <div className="flex gap-2">
                              <button disabled={saving} className="rounded-lg bg-saffron-500 px-3 py-2 font-bold text-white">Save</button>
                              <button type="button" onClick={() => setEditingBooking(null)} className="rounded-lg border border-earth-100 px-3 py-2 font-semibold">Cancel</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={booking.id}>
                        <td className="px-5 py-4 font-semibold">{format(parseISO(booking.slotDate), 'MMM d, yyyy')}<span className="block font-normal text-earth-700">{formatSlotTime(booking.startTime, booking.endTime)}</span></td>
                        <td className="px-5 py-4">{booking.familyName}</td>
                        <td className="px-5 py-4">{booking.phone}<span className="block text-earth-700">{booking.email}</span></td>
                        <td className="px-5 py-4">{booking.headcount}</td>
                        <td className="px-5 py-4 capitalize">{booking.status.replace('_', ' ')}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2"><select
                            value={booking.status}
                            onChange={event => void changeStatus(booking, event.target.value as AdminBooking['status'])}
                            className="rounded-lg border border-earth-100 bg-white px-2 py-1.5"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No-show</option>
                          </select>
                          <button type="button" onClick={() => setEditingBooking({ ...booking })} className="rounded-lg border border-earth-100 px-2 py-1.5 font-semibold">Edit</button></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'schedule' && (
          <section className="mt-6 max-w-2xl rounded-2xl bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-xl font-bold">Weekly visit schedule</h2>
            <p className="mt-2 text-sm leading-6 text-earth-700">Changes apply to newly generated availability. Existing confirmed bookings stay intact.</p>
            <div className="mt-7">
              <p className="text-sm font-semibold">Open days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => toggleDay(index + 1)}
                    className={`h-11 w-14 rounded-xl border text-sm font-semibold ${
                      schedule.daysOfWeek.includes(index + 1) ? 'border-saffron-500 bg-saffron-50 text-saffron-700' : 'border-earth-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">Opening time<input type="time" value={schedule.startTime} onChange={event => setSchedule({ ...schedule, startTime: event.target.value })} className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-semibold">Closing time<input type="time" value={schedule.endTime} onChange={event => setSchedule({ ...schedule, endTime: event.target.value })} className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-semibold">Slot length (minutes)<input type="number" min={15} max={480} step={15} value={schedule.slotLengthMinutes} onChange={event => setSchedule({ ...schedule, slotLengthMinutes: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-normal" /></label>
              <label className="text-sm font-semibold">Family capacity per slot<input type="number" min={1} max={20} value={schedule.familyCapacityPerSlot} onChange={event => setSchedule({ ...schedule, familyCapacityPerSlot: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-normal" /></label>
            </div>
            <button onClick={() => void saveSchedule()} disabled={saving || schedule.daysOfWeek.length === 0} className="mt-7 rounded-xl bg-saffron-500 px-6 py-3 font-bold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
          </section>
        )}

        {tab === 'blocking' && (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold">Upcoming visit times</h2>
            <p className="mt-2 text-sm text-earth-700">Block a time for holidays, private events, or maintenance.</p>
            <form onSubmit={blockWholeDay} className="mt-6 grid gap-3 rounded-2xl border border-saffron-100 bg-saffron-50/40 p-4 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end">
              <label className="text-sm font-semibold">Whole date<input required type="date" value={blockDay} onChange={event => setBlockDay(event.target.value)} className="mt-2 block rounded-xl border border-earth-100 bg-white px-3 py-2 font-normal" /></label>
              <label className="text-sm font-semibold">Reason<input value={blockReason} maxLength={500} onChange={event => setBlockReason(event.target.value)} placeholder="Holiday, event, maintenance…" className="mt-2 block w-full rounded-xl border border-earth-100 bg-white px-3 py-2 font-normal" /></label>
              <button disabled={saving} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Block date</button>
              <button type="button" disabled={saving} onClick={() => void reopenWholeDay()} className="rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-bold text-emerald-700 disabled:opacity-60">Reopen date</button>
            </form>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border border-earth-100 p-4">
                  <div>
                    <p className="font-semibold">{format(parseISO(slot.date), 'EEE, MMM d')}</p>
                    <p className="text-sm text-earth-700">{formatSlotTime(slot.startTime, slot.endTime)} · {slot.familyBookingsCount} booked</p>
                  </div>
                  <button
                    onClick={() => void toggleBlock(slot)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${slot.status === 'blocked' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {slot.status === 'blocked' ? 'Reopen' : 'Block'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
