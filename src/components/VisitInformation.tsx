import { Info, MapPin } from 'lucide-react';

const locations = [
  {
    label: 'Gaushala location',
    address: '1945 Old Atlanta Rd, Cumming, GA 30041',
  },
  {
    label: 'Parking location',
    address: '3100-3660 Melody Mizer Ln, Cumming, GA 30041',
  },
];

const guidelines = [
  "For food, only bring fresh bananas and carrots. If you wouldn't eat it, don't bring it.",
  'Be respectful and do not litter.',
  'Your visit will last approximately one hour.',
];

function googleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          {locations.map(location => (
            <div key={location.label} className="flex items-start gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" size={20} />
              <div>
                <p className="text-sm font-semibold text-earth-900">{location.label}</p>
                <a
                  href={googleMapsUrl(location.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm leading-6 text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-900 hover:decoration-blue-500"
                >
                  {location.address}
                </a>
              </div>
            </div>
          ))}

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
