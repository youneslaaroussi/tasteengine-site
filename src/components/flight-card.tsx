
'use client'

import { memo, useState } from 'react'
import { BookingFlightOption, FlightSegment } from '@/types/flights'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/hooks/use-booking'
import { useAnalytics } from '@/hooks/use-analytics'
import { Clock, Briefcase, Users, AlertCircle, Plane, ChevronDown } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
  const { trackEvent } = useAnalytics()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleBooking = () => {
    generateBookingUrl({
      searchId,
      flightId: flight.id,
      termsUrl: 'https://gofly.to/terms',
    })
  }

  const handleToggleExpand = () => {
    if (!isExpanded) {
      trackEvent('view_flight_details', 'flights', flight.id, 1)
    }
    setIsExpanded(!isExpanded)
  }

  const renderSegment = (segment: FlightSegment) => (
    <div key={segment.segmentNumber} className="flex items-center space-x-4">
      <div className="flex-grow border-t border-dashed border-gray-300"></div>
      <div className="text-sm text-gray-500">{segment.duration}</div>
    </div>
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 p-4"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center space-x-4">
          <Plane className="w-6 h-6 text-gray-500" />
          <div>
            <div className="font-semibold text-lg">{flight.origin} → {flight.destination}</div>
            <div className="text-sm text-gray-600">{flight.partnerInfo?.name || flight.airline}</div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-500 transform transition-transform',
            isExpanded && 'rotate-180',
          )}
        />
      </CardHeader>
      {isExpanded && (
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-xl text-blue-600">{flight.currency}{flight.price}</div>
              <div className="text-xs text-gray-500">{flight.journeyType}</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-700">Total Duration: {flight.totalDuration} ({flight.totalStops} stops)</div>
              <div className="font-medium text-gray-700">Baggage: {flight.baggageAllowance}</div>
              <div className="font-medium text-gray-700">Seats Available: {flight.availableSeats}</div>
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
            <Button onClick={handleBooking} disabled={isGenerating || !flight.pricingToken}>
              {isGenerating ? 'Booking...' : 'Book Now'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
})

FlightCard.displayName = 'FlightCard' 