import { memo } from 'react';
import { Plane, MapPin, Calendar, Clock, Users, CreditCard, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlightItineraryCardProps {
  itinerary: {
    id: string;
    createdAt: string;
    travelerName: string;
    tripName: string;
    notes: string;
    summary: {
      totalFlights: number;
      totalPrice: number;
      currency: string;
      destinations: string;
      origins: string;
    };
    flights: Array<{
      sequence: number;
      id: string;
      origin: {
        code: string;
        city: string;
      };
      destination: {
        code: string;
        city: string;
      };
      departure: {
        dateTime: string;
        date: string;
        time: string;
      };
      arrival: {
        dateTime: string;
        date: string;
        time: string;
      };
      airline: string;
      price: {
        amount: number;
        currency: string;
      };
      duration: string;
      stops: number;
      aircraft: string;
      bookingClass: string;
    }>;
    metadata: {
      generatedBy: string;
      version: string;
      format: string;
    };
  };
  json?: string;
}

export const FlightItineraryCard = memo(function FlightItineraryCard({ itinerary, json }: FlightItineraryCardProps) {
  // Defensive checks to prevent runtime errors
  if (!itinerary) {
    console.error('FlightItineraryCard: itinerary prop is required');
    return <div className="text-red-500 p-4">Error: Missing itinerary data</div>;
  }

  if (!itinerary.summary) {
    console.error('FlightItineraryCard: itinerary.summary is required');
    return <div className="text-red-500 p-4">Error: Missing itinerary summary data</div>;
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const time = timeString.includes('T') ? timeString.split('T')[1] : timeString;
      return time.split('.')[0].slice(0, 5); // Get HH:MM format
    } catch {
      return timeString;
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount || 0);
    } catch {
      return `${currency || 'USD'} ${amount || 0}`;
    }
  };

  const handleDownloadJSON = () => {
    if (!json) return;
    
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flight-itinerary-${itinerary.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading JSON:', error);
    }
  };

  // Safe access to summary fields with defaults
  const summary = itinerary.summary || {};
  const totalFlights = summary.totalFlights || 0;
  const totalPrice = summary.totalPrice || 0;
  const currency = summary.currency || 'USD';
  const destinations = summary.destinations || 'Unknown';
  const origins = summary.origins || 'Unknown';
  const flights = itinerary.flights || [];

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{itinerary.tripName || 'Flight Itinerary'}</h3>
              <p className="text-sm text-gray-600">Created on {formatDate(itinerary.createdAt || new Date().toISOString())}</p>
            </div>
          </div>
          {json && (
            <Button
              onClick={handleDownloadJSON}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </Button>
          )}
        </div>
      </div>

      {/* Traveler Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Traveler</span>
        </div>
        <p className="text-gray-800 font-medium">{itinerary.travelerName || 'Unknown Traveler'}</p>
        {itinerary.notes && (
          <p className="text-sm text-gray-600 mt-2">{itinerary.notes}</p>
        )}
      </div>

      {/* Trip Summary */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalFlights}</div>
            <div className="text-sm text-gray-600">Flight{totalFlights !== 1 ? 's' : ''}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(totalPrice, currency)}
            </div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">{origins}</div>
            <div className="text-sm text-gray-600">Origin{origins.includes(',') ? 's' : ''}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">{destinations}</div>
            <div className="text-sm text-gray-600">Destination{destinations.includes(',') ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Flights */}
      <div className="p-6">
        <div className="space-y-4">
          {flights.map((flight, index) => (
            <div key={flight.id || index} className="border border-gray-200 rounded-lg p-4">
              {/* Flight Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{flight.sequence || index + 1}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{flight.airline || 'Unknown Airline'}</div>
                    <div className="text-sm text-gray-600">{flight.aircraft || 'Unknown Aircraft'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(flight.price?.amount || 0, flight.price?.currency || currency)}
                  </div>
                  <div className="text-sm text-gray-600">{flight.bookingClass || 'Economy'}</div>
                </div>
              </div>

              {/* Flight Route */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    {/* Departure */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{flight.origin?.code || 'XXX'}</div>
                      <div className="text-sm text-gray-600">{flight.origin?.city || 'Unknown'}</div>
                      <div className="text-sm text-gray-900 mt-1">{formatTime(flight.departure?.time || flight.departure?.dateTime || '')}</div>
                      <div className="text-xs text-gray-500">{formatDate(flight.departure?.date || flight.departure?.dateTime || '')}</div>
                    </div>

                    {/* Flight Path */}
                    <div className="flex-1 flex items-center justify-center relative">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="flex-1 h-px bg-gray-300 relative">
                          <Plane className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white" />
                        </div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                        {flight.duration || 'Unknown'}
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{flight.destination?.code || 'XXX'}</div>
                      <div className="text-sm text-gray-600">{flight.destination?.city || 'Unknown'}</div>
                      <div className="text-sm text-gray-900 mt-1">{formatTime(flight.arrival?.time || flight.arrival?.dateTime || '')}</div>
                      <div className="text-xs text-gray-500">{formatDate(flight.arrival?.date || flight.arrival?.dateTime || '')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Details */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{flight.stops === 0 ? 'Direct' : `${flight.stops || 0} stop${(flight.stops || 0) > 1 ? 's' : ''}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{flight.duration || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    <span>{flight.bookingClass || 'Economy'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Generated by {itinerary.metadata?.generatedBy || 'Travel Assistant'}</span>
          <span>ID: {itinerary.id || 'unknown'}</span>
        </div>
      </div>
    </Card>
  );
}); 