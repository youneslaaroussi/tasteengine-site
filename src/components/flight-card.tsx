
'use client'

import { memo } from 'react'
import { BookingFlightOption, FlightSegment } from '@/types/flights'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/hooks/use-booking'
import { Clock, Briefcase, Users, AlertCircle } from 'lucide-react'

interface FlightCardProps {
  flight: BookingFlightOption
  searchId: string
}

const FlightSegmentCard = memo(({ segment }: { segment: FlightSegment }) => (
  <div className="border-t border-gray-200 pt-3 mt-3">
    <div className="flex justify-between items-center text-sm">
      <div className="font-medium">{segment.origin} → {segment.destination}</div>
      <div className="text-gray-600">{segment.airline} {segment.flightNumber}</div>
    </div>
    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
      <div>{segment.departureDate} at {segment.departureTime}</div>
      <div>Arrival: {segment.arrivalTime}</div>
      <div>Duration: {segment.duration}</div>
    </div>
  </div>
))
FlightSegmentCard.displayName = 'FlightSegmentCard'

export const FlightCard = memo(({ flight, searchId }: FlightCardProps) => {
  const { generateBookingUrl, isGenerating } = useBooking()

  const handleBookClick = () => {
    if (flight.pricingToken) {
      generateBookingUrl({ searchId, termsUrl: flight.pricingToken })
    } else {
      alert('This flight cannot be booked at the moment.')
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-lg">{flight.origin} → {flight.destination}</div>
          <div className="text-sm text-gray-600">{flight.partnerInfo?.name || flight.airline}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-xl text-blue-600">{flight.currency}{flight.price}</div>
          <div className="text-xs text-gray-500">{flight.journeyType}</div>
        </div>
      </div>

      <div className="my-3 space-y-1 text-sm text-gray-700">
        <div className="flex items-center gap-2"><Clock size={14} /> Total Duration: {flight.totalDuration} ({flight.totalStops} stops)</div>
        <div className="flex items-center gap-2"><Briefcase size={14} /> Baggage: {flight.baggageAllowance}</div>
        <div className="flex items-center gap-2"><Users size={14} /> Seats Available: {flight.availableSeats}</div>
      </div>

      <div>
        {flight.segments.map(segment => (
          <FlightSegmentCard key={segment.segmentNumber} segment={segment} />
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-xs text-gray-500 flex items-center gap-1">
            <AlertCircle size={14} />
            <span>{flight.cancellationPolicy}</span>
        </div>
        <Button onClick={handleBookClick} disabled={isGenerating || !flight.pricingToken}>
          {isGenerating ? 'Booking...' : 'Book Now'}
        </Button>
      </div>
    </div>
  )
})

FlightCard.displayName = 'FlightCard' 