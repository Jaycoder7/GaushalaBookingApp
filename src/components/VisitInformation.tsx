import { Info, LockKeyhole, MapPin } from 'lucide-react';

const guidelines = [
  "For food, only bring fresh bananas and carrots. If you wouldn't eat it, don't bring it.",
  'Be respectful and do not litter.',
  'Your visit will last approximately one hour.',
];

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
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
            <span className="font-semibold">Visit duration:</span> 1 hour
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-earth-900">Guidelines</h3>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-earth-700">
            {guidelines.map(guideline => (
              <li key={guideline} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
