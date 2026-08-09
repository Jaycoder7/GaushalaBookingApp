import { MapPin, Info } from 'lucide-react';

const GAUSHALA_LOCATION = '1945 Old Atlanta Rd, Cumming, GA 30041';
const PARKING_LOCATION = '3100-3660 Melody Mizer Ln, Cumming, GA 30041';
const VISIT_DURATION = '1 hour';

const googleMapsUrl = (address: string) => 
  `https://www.google.com/maps/search/${encodeURIComponent(address)}`;

export default function VisitInformation() {
  return (
    <div className="bg-white border-l-4 border-blue-500 rounded-lg p-6 mb-8 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
        <h2 className="text-xl font-semibold text-gray-900">Visit Information</h2>
      </div>

      <div className="space-y-4 ml-8">
        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-600">Gaushala Location</p>
            <a
              href={googleMapsUrl(GAUSHALA_LOCATION)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {GAUSHALA_LOCATION}
            </a>
          </div>
        </div>

        {/* Parking */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-600">Parking Location</p>
            <a
              href={googleMapsUrl(PARKING_LOCATION)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {PARKING_LOCATION}
            </a>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-purple-600">⏱</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Visit Duration</p>
            <p className="text-gray-900 font-medium">{VISIT_DURATION}</p>
          </div>
        </div>

        {/* Guidelines */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm font-medium text-gray-600 mb-3">Guidelines</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>For food, only bring fresh bananas and carrots. If you wouldn't eat it, don't bring it.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Be respectful and do not litter.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Your visit will last approximately one hour.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
