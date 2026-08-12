import { CheckCircle2, Info, LockKeyhole, MapPin, XCircle } from 'lucide-react';

const dos = [
  'Follow all instructions from Gaushala staff and volunteers.',
  'Keep children under age 12 within an adult’s reach and supervise them closely at all times.',
  'Wear comfortable, closed-toe shoes and remain in designated visitor areas.',
  'Be calm and respectful around the cows, and place all trash in the proper bins.',
];

const donts = [
  'Do not bring purses, bags, backpacks, or other unnecessary personal items.',
  'Do not bring human food such as roti, puri, halwa, ladoos, or similar items.',
  'Do not bring raw vegetables or any other food items unless Gaushala staff specifically asks you to.',
  'Do not reach through or over a fence to feed or pet an animal, especially from behind the fence.',
  'Do not run, shout, litter, or enter restricted animal-care areas.',
];

function GuidelineList({ items, tone }: { items: string[]; tone: 'do' | 'dont' }) {
  const isDo = tone === 'do';
  const Icon = isDo ? CheckCircle2 : XCircle;
  return (
    <div className={`rounded-2xl border p-5 ${isDo ? 'border-emerald-200 bg-emerald-50/70' : 'border-red-200 bg-red-50/70'}`}>
      <h3 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${isDo ? 'text-emerald-800' : 'text-red-800'}`}>
        <Icon aria-hidden="true" size={20} />
        {isDo ? 'Do' : "Don't"}
      </h3>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-earth-800">
        {items.map(item => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${isDo ? 'bg-emerald-600' : 'bg-red-600'}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VisitInformation() {
  return (
    <section
      aria-labelledby="visit-information-heading"
      className="mx-auto mt-8 max-w-5xl rounded-2xl border border-earth-100 border-l-4 border-l-blue-500 bg-white p-6 shadow-soft sm:p-8"
    >
      <div className="flex items-center gap-3 text-earth-900">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Info aria-hidden="true" size={22} strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-semibold text-blue-600">Before you arrive</p>
          <h2 id="visit-information-heading" className="text-2xl font-bold">Visit information</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-earth-900">Visit location</p>
              <p className="mt-1 text-sm leading-6 text-earth-700">Cumming, Georgia</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-blue-950">Address shared after approval</p>
              <p className="mt-1 text-sm leading-6 text-blue-900">The exact Gaushala and parking addresses are shown in your booking status once an administrator confirms your visit.</p>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-950">
            <span className="font-semibold">Expected visit duration:</span> 30–45 minutes
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <GuidelineList items={dos} tone="do" />
          <GuidelineList items={donts} tone="dont" />
        </div>
      </div>
    </section>
  );
}
