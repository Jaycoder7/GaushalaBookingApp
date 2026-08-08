import HCaptcha from '@hcaptcha/react-hcaptcha';
import axios from 'axios';
import { addDays, format, parseISO } from 'date-fns';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createBooking, BookingResponse } from '../services/bookings.service';
import { getAvailableSlots, Slot } from '../services/slots.service';
import { formatSlotTime } from '../utils/formatting';

interface BookingForm {
  familyName: string;
  phone: string;
  email: string;
  headcount: number;
  note: string;
}

const initialForm: BookingForm = {
  familyName: '',
  phone: '',
  email: '',
  headcount: 1,
  note: '',
};

function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === 'string') return message;
    if (!error.response) return 'We could not reach the booking service. Please try again shortly.';
  }
  return 'Something went wrong. Please try again.';
}

export default function BookingPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<BookingResponse | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HCaptcha>(null);
  const captchaSiteKey = import.meta.env.MODE === 'test'
    ? undefined
    : import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined;

  useEffect(() => {
    const loadSlots = async () => {
      setLoadingSlots(true);
      setError('');
      try {
        const start = format(new Date(), 'yyyy-MM-dd');
        const end = format(addDays(new Date(), 29), 'yyyy-MM-dd');
        const available = await getAvailableSlots(start, end);
        setSlots(available);
        const firstOpen = available.find(slot => slot.status === 'open');
        if (firstOpen) setSelectedDate(firstOpen.date);
      } catch (loadError) {
        setError(apiError(loadError));
      } finally {
        setLoadingSlots(false);
      }
    };
    void loadSlots();
  }, []);

  const dates = useMemo(
    () => Array.from(new Set(slots.map(slot => slot.date))),
    [slots]
  );
  const daySlots = slots.filter(slot => slot.date === selectedDate);
  const selectedSlot = slots.find(slot => slot.id === selectedSlotId);

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotId('');
    setError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!selectedSlotId) {
      setError('Choose an available visit time before continuing.');
      return;
    }
    if (captchaSiteKey && !captchaToken) {
      setError('Please complete the CAPTCHA challenge.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createBooking({
        ...form,
        slotId: selectedSlotId,
        captchaToken: captchaSiteKey ? captchaToken : 'development-bypass',
      });
      setSuccess(response);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(apiError(submitError));
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
    } finally {
      setSubmitting(false);
    }
  };

  if (success && selectedSlot) {
    return (
      <main className="min-h-screen bg-earth-50 px-4 py-12 sm:py-20">
        <section className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-soft">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-10 text-white">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">✓</div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">Booking confirmed</p>
            <h1 className="text-3xl font-bold">We look forward to welcoming you.</h1>
          </div>
          <div className="space-y-6 p-8">
            <div className="rounded-2xl border border-earth-100 bg-earth-50 p-5">
              <p className="font-semibold text-earth-900">{format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy')}</p>
              <p className="mt-1 text-earth-700">{formatSlotTime(selectedSlot.startTime, selectedSlot.endTime)}</p>
              <p className="mt-1 text-sm text-earth-700">{form.headcount} {form.headcount === 1 ? 'visitor' : 'visitors'} · {form.familyName}</p>
            </div>
            <p className="text-sm leading-6 text-earth-700">
              A confirmation has been sent to <strong>{form.email}</strong>. Keep the cancellation link below in case your plans change.
            </p>
            <a
              href={success.cancellationLink}
              className="inline-flex w-full justify-center rounded-xl border border-earth-100 px-5 py-3 font-semibold text-saffron-700 transition hover:bg-saffron-50"
            >
              View or cancel this booking
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-earth-50">
      <header className="relative overflow-hidden bg-earth-900 px-4 py-14 text-white sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,120,24,0.28),transparent_45%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 flex justify-end">
            <Link to="/admin" className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Admin login
            </Link>
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-saffron-500">Visit the Gaushala</p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Plan a peaceful visit with your family.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-300">
            Choose a date and time, tell us who is coming, and we will reserve your visit.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="mx-auto grid min-w-0 max-w-5xl gap-7 px-4 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:py-12">
        <section className="min-w-0 rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-saffron-600">Step 1</p>
              <h2 className="mt-1 text-2xl font-bold">Choose your visit</h2>
            </div>
            <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-semibold text-saffron-700">Next 30 days</span>
          </div>

          {loadingSlots ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse rounded-2xl bg-earth-100" />)}
            </div>
          ) : dates.length === 0 ? (
            <div className="rounded-2xl bg-earth-50 p-6 text-center text-earth-700">No visit times are currently available.</div>
          ) : (
            <>
              <div className="max-w-full touch-pan-x overflow-x-auto overscroll-x-contain pb-3">
                <div className="flex w-max gap-3 pr-1">
                {dates.map(date => {
                  const openCount = slots.filter(slot => slot.date === date && slot.status === 'open').length;
                  return (
                    <button
                      type="button"
                      key={date}
                      onClick={() => selectDate(date)}
                      className={`min-w-[106px] rounded-2xl border px-4 py-3 text-left transition ${
                        selectedDate === date
                          ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                          : 'border-earth-100 hover:border-saffron-500'
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase">{format(parseISO(date), 'EEE')}</span>
                      <span className="mt-1 block text-lg font-bold">{format(parseISO(date), 'MMM d')}</span>
                      <span className="mt-1 block text-xs">{openCount ? `${openCount} times` : 'Unavailable'}</span>
                    </button>
                  );
                })}
                </div>
              </div>

              <div className="mt-6 max-h-[22rem] overflow-y-auto overscroll-y-contain pr-1">
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
                {daySlots.map(slot => {
                  const available = slot.status === 'open';
                  return (
                    <button
                      type="button"
                      key={slot.id}
                      disabled={!available}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        selectedSlotId === slot.id
                          ? 'border-saffron-500 bg-saffron-500 text-white'
                          : available
                            ? 'border-earth-100 hover:border-saffron-500 hover:text-saffron-700'
                            : 'cursor-not-allowed border-transparent bg-earth-50 text-stone-400 line-through'
                      }`}
                    >
                      <span className="block">{formatSlotTime(slot.startTime, slot.endTime)}</span>
                      <span className={`mt-1 block text-xs font-normal ${selectedSlotId === slot.id ? 'text-white/90' : 'text-earth-700'}`}>
                        {slot.remainingCapacity} {slot.remainingCapacity === 1 ? 'family spot' : 'family spots'} left
                      </span>
                    </button>
                  );
                })}
              </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold text-saffron-600">Step 2</p>
          <h2 className="mt-1 text-2xl font-bold">Your details</h2>
          <div className="mt-7 space-y-5">
            <label className="block text-sm font-semibold">
              Family name
              <input
                required
                minLength={2}
                maxLength={255}
                value={form.familyName}
                onChange={event => setForm({ ...form, familyName: event.target.value })}
                className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-normal"
                placeholder="e.g. Sharma family"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block text-sm font-semibold">
                Phone
                <input
                  required
                  type="tel"
                  pattern="\+?[1-9]\d{1,14}"
                  value={form.phone}
                  onChange={event => setForm({ ...form, phone: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-normal"
                  placeholder="+15551234567"
                />
              </label>
              <label className="block text-sm font-semibold">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-earth-100 px-4 py-3 font-normal"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Number of visitors
              <select
                value={form.headcount}
                onChange={event => setForm({ ...form, headcount: Number(event.target.value) })}
                className="mt-2 w-full rounded-xl border border-earth-100 bg-white px-4 py-3 font-normal"
              >
                {[1, 2, 3, 4, 5, 6].map(count => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Note <span className="font-normal text-stone-400">(optional)</span>
              <textarea
                maxLength={1000}
                rows={3}
                value={form.note}
                onChange={event => setForm({ ...form, note: event.target.value })}
                className="mt-2 w-full resize-none rounded-xl border border-earth-100 px-4 py-3 font-normal"
                placeholder="Accessibility needs or anything we should know"
              />
            </label>
            {captchaSiteKey && (
              <div className="overflow-hidden">
                <HCaptcha ref={captchaRef} sitekey={captchaSiteKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
              </div>
            )}
            {error && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={submitting || loadingSlots}
              className="w-full rounded-xl bg-saffron-500 px-5 py-3.5 font-bold text-white transition hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Reserving your visit…' : 'Confirm booking'}
            </button>
            <p className="text-center text-xs leading-5 text-stone-500">One booking per phone number or email for each visit time.</p>
          </div>
        </section>
      </form>
    </main>
  );
}
