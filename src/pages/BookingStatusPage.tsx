import { format, parseISO } from 'date-fns';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRecentBookings } from '../services/recent-bookings.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function BookingStatusPage() {
  const navigate = useNavigate();
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [recentBookings] = useState(() => getRecentBookings());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const token = reference.trim();
    if (!UUID.test(token)) {
      setError('Enter the complete booking reference shown after you submitted your request.');
      return;
    }
    navigate(`/booking/${token}`);
  };

  return (
    <main className="min-h-screen bg-earth-50 px-4 py-12 sm:py-20">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="bg-earth-900 px-7 py-9 text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron-500">Visitor access</p>
          <h1 className="mt-2 text-3xl font-bold">Check booking status</h1>
          <p className="mt-3 leading-7 text-stone-300">See whether your request is pending, confirmed, rejected, or cancelled. No email is required.</p>
        </div>
        <div className="space-y-8 p-7 sm:p-10">
          {recentBookings.length > 0 && (
            <section aria-labelledby="recent-bookings-heading">
              <h2 id="recent-bookings-heading" className="text-lg font-bold">Bookings saved on this device</h2>
              <div className="mt-4 space-y-3">
                {recentBookings.map(booking => (
                  <Link key={booking.token} to={`/booking/${booking.token}`} className="flex items-center justify-between gap-4 rounded-2xl border border-earth-100 p-4 transition hover:border-saffron-500 hover:bg-saffron-50">
                    <span>
                      <span className="block font-semibold text-earth-900">{booking.familyName}</span>
                      <span className="mt-1 block text-sm text-earth-700">{format(parseISO(booking.slotDate), 'MMMM d, yyyy')}</span>
                    </span>
                    <span className="font-semibold text-saffron-700">View status →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <form onSubmit={submit}>
            <label className="block text-sm font-semibold">
              Booking reference
              <input
                value={reference}
                onChange={event => { setReference(event.target.value); setError(''); }}
                className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-mono font-normal"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoComplete="off"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-earth-700">This private reference was displayed after you submitted your booking. Keep it confidential.</p>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            <button className="mt-5 w-full rounded-xl bg-saffron-500 px-5 py-3 font-bold text-white hover:bg-saffron-600">View booking</button>
          </form>
          <Link to="/" className="inline-flex font-semibold text-saffron-700">← Return to booking page</Link>
        </div>
      </section>
    </main>
  );
}
