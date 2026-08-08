import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookingDetails, cancelBooking, getBooking } from '../services/bookings.service';
import { formatTime } from '../utils/formatting';

function apiError(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  return 'We could not load this booking. Check the link and try again.';
}

export default function CancelPage() {
  const { token = '' } = useParams();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setBooking(await getBooking(token));
      } catch (loadError) {
        setError(apiError(loadError));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const cancel = async () => {
    if (!window.confirm('Cancel this Gaushala visit? This will release the time for another family.')) return;
    setCancelling(true);
    setError('');
    try {
      const result = await cancelBooking(token);
      setBooking(current => current ? { ...current, status: result.status } : current);
    } catch (cancelError) {
      setError(apiError(cancelError));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-earth-50 px-4 py-12">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="bg-earth-900 px-7 py-8 text-white sm:px-9">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron-500">Your reservation</p>
          <h1 className="mt-2 text-3xl font-bold">Manage your visit</h1>
        </div>
        <div className="p-7 sm:p-9">
          {loading ? (
            <div className="space-y-3">
              <div className="h-7 w-2/3 animate-pulse rounded bg-earth-100" />
              <div className="h-20 animate-pulse rounded-2xl bg-earth-100" />
            </div>
          ) : error && !booking ? (
            <div>
              <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
              <Link to="/" className="mt-6 inline-flex font-semibold text-saffron-700">Book a new visit →</Link>
            </div>
          ) : booking ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-earth-100 bg-earth-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-earth-900">{booking.familyName}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    booking.status === 'cancelled' ? 'bg-stone-200 text-stone-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <p className="mt-4 text-lg font-semibold">{format(parseISO(booking.slotDate), 'EEEE, MMMM d, yyyy')}</p>
                <p className="mt-1 text-earth-700">{formatTime(booking.slotTime)} · {booking.headcount} {booking.headcount === 1 ? 'visitor' : 'visitors'}</p>
              </div>

              {booking.status === 'cancelled' ? (
                <div className="rounded-xl bg-stone-100 p-4 text-stone-700">
                  This booking has been cancelled and the visit time has been released.
                </div>
              ) : (
                <>
                  <p className="text-sm leading-6 text-earth-700">
                    If your plans change, please cancel so another family can use this visit time.
                  </p>
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={cancelling}
                    className="w-full rounded-xl border border-red-200 px-5 py-3 font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel this visit'}
                  </button>
                </>
              )}
              {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
              <Link to="/" className="inline-flex font-semibold text-saffron-700">← Back to booking</Link>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
