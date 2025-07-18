'use client'

import React, { memo, useState, useCallback } from 'react'
import { BookingFlightOption, FlightSegment } from '@/types/flights'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { useBooking } from '@/hooks/use-booking'
import { useAnalytics } from '@/hooks/use-analytics'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Clock,
  Briefcase,
  Users,
  AlertCircle,
  Plane,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlightCardProps {
  flight: BookingFlightOption
  searchId: string | null
  className?: string
  onBookingError?: (error: string) => void
}

interface FlightSegmentCardProps {
  segment: FlightSegment
  isLast: boolean
}

const FlightSegmentCard = memo(({ segment, isLast }: FlightSegmentCardProps) => {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn('border-t border-gray-200 pt-3 mt-3', isLast && 'border-b-0')}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <MapPin size={14} className="text-gray-500" />
          <span className="font-medium text-sm">
            {segment.origin} → {segment.destination}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">
            {segment.airline} {segment.flightNumber}
          </div>
          <div className="text-xs text-gray-500 uppercase">{segment.travelClass}</div>
        </div>
      </div>
      
      <div className={cn(
        'grid gap-2 text-xs text-gray-600',
        isMobile ? 'grid-cols-1' : 'grid-cols-3'
      )}>
        <div className="flex items-center space-x-1">
          <Calendar size={12} />
          <span>{segment.departureDate}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock size={12} />
          <span>{segment.departureTime} → {segment.arrivalTime}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Timer size={12} />
          <span>{segment.duration}</span>
          {segment.stops > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs">
              {segment.stops} stop{segment.stops > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
FlightSegmentCard.displayName = 'FlightSegmentCard'

export const FlightCard = memo(({ 
  flight, 
  searchId, 
  className,
  onBookingError 
}: FlightCardProps) => {
  const isMobile = useIsMobile()
  const { generateBookingUrl, isGenerating } = useBooking()
  const { trackEvent } = useAnalytics()
  const [isExpanded, setIsExpanded] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const handleBooking = useCallback(async () => {
    if (!searchId || !flight.pricingToken) {
      const error = 'Unable to book: Missing booking information'
      setBookingError(error)
      onBookingError?.(error)
      return
    }

    try {
      setBookingError(null)
      await generateBookingUrl({
        searchId,
        flightId: flight.id,
        termsUrl: 'https://gofly.to/terms',
      })
      
      trackEvent('flight_booking', 'attempt', flight.id, flight.price)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Booking failed'
      setBookingError(errorMessage)
      onBookingError?.(errorMessage)
      console.error('Booking error:', error)
    }
  }, [searchId, flight, generateBookingUrl, trackEvent, onBookingError])

  const handleToggleExpand = useCallback(() => {
    if (!isExpanded) {
      trackEvent('view_flight_details', 'flights', flight.id, 1)
    }
    setIsExpanded(!isExpanded)
  }, [isExpanded, trackEvent, flight.id])

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount)
    } catch {
      return `${currency || '$'}${amount}`
    }
  }

  const getStopsText = (stops: number) => {
    if (stops === 0) return 'Direct'
    if (stops === 1) return '1 stop'
    return `${stops} stops`
  }

  const canBook = Boolean(searchId && flight.pricingToken && !isGenerating)

  if (isMobile) {
    return (
      <Card className={cn('overflow-hidden shadow-sm', className)}>
        <CardHeader 
          className="cursor-pointer p-4 hover:bg-gray-50 transition-colors"
          onClick={handleToggleExpand}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <Plane className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <h3 className="font-semibold text-base truncate">
                  {flight.origin} → {flight.destination}
                </h3>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {flight.partnerInfo?.name || flight.airline}
              </div>
              <div className="flex items-center text-xs text-gray-500 space-x-3">
                <span>{flight.totalDuration}</span>
                <span>{getStopsText(flight.totalStops)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end ml-4">
              <div className="font-bold text-lg text-blue-600">
                {formatCurrency(flight.price, flight.currency)}
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-500 transform transition-transform mt-1',
                  isExpanded && 'rotate-180'
                )}
              />
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {/* Flight Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-gray-500" />
                  <span>{flight.baggageAllowance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-500" />
                  <span>{flight.availableSeats} left</span>
                </div>
              </div>

              {/* Segments */}
              <div>
                {flight.segments.map((segment, index) => (
                  <FlightSegmentCard 
                    key={segment.segmentNumber} 
                    segment={segment}
                    isLast={index === flight.segments.length - 1}
                  />
                ))}
              </div>

              {/* Policies */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-start gap-1">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{flight.cancellationPolicy}</span>
                </div>
                <div className="flex items-start gap-1">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span>{flight.changePolicy}</span>
                </div>
              </div>

              {/* Booking Error */}
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-2 rounded">
                  {bookingError}
                </div>
              )}

              {/* Book Button */}
              <Button 
                onClick={handleBooking} 
                disabled={!canBook}
                className="w-full"
                size="lg"
              >
                {isGenerating ? 'Booking...' : 'Book Flight'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  // Desktop Layout
  return (
    <Card className={cn('overflow-hidden shadow-sm hover:shadow-md transition-shadow', className)}>
      <CardHeader 
        className="cursor-pointer p-6 hover:bg-gray-50 transition-colors"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            <div className="flex items-center space-x-3">
              <Plane className="w-6 h-6 text-gray-500" />
              <div>
                <h3 className="font-semibold text-xl">
                  {flight.origin} → {flight.destination}
                </h3>
                <p className="text-sm text-gray-600">
                  {flight.partnerInfo?.name || flight.airline}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{flight.totalDuration}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{getStopsText(flight.totalStops)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{flight.availableSeats} seats</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="font-bold text-2xl text-blue-600">
                {formatCurrency(flight.price, flight.currency)}
              </div>
              <div className="text-xs text-gray-500 uppercase">
                {flight.journeyType}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-gray-500 transform transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            {/* Flight Information Grid */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-gray-500" />
                <span>Baggage: {flight.baggageAllowance}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-500" />
                <span>Available: {flight.availableSeats} seats</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer size={16} className="text-gray-500" />
                <span>Duration: {flight.totalDuration}</span>
              </div>
            </div>

            {/* Flight Segments */}
            <div>
              {flight.segments.map((segment, index) => (
                <FlightSegmentCard 
                  key={segment.segmentNumber} 
                  segment={segment}
                  isLast={index === flight.segments.length - 1}
                />
              ))}
            </div>
            
            {/* Policies and Booking */}
            <div className="flex justify-between items-start pt-4 border-t">
              <div className="text-xs text-gray-500 space-y-1 max-w-md">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Cancellation:</p>
                    <p>{flight.cancellationPolicy}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Changes:</p>
                    <p>{flight.changePolicy}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-2 rounded max-w-xs">
                    {bookingError}
                  </div>
                )}
                <Button 
                  onClick={handleBooking} 
                  disabled={!canBook}
                  size="lg"
                  className="min-w-[120px]"
                >
                  {isGenerating ? 'Booking...' : 'Book Flight'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
})

FlightCard.displayName = 'FlightCard'