import VisitInformation from '../components/VisitInformation';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Book Your Gaushala Visit</h1>
        <p className="text-center text-gray-600 mb-8">Schedule a time to visit and interact with our animals</p>
        
        <VisitInformation />
        
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Booking form component - to be implemented</p>
          {/* TODO: Implement booking form */}
        </div>
      </div>
    </div>
  );
}
