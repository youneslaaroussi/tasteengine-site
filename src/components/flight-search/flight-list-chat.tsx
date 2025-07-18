'use client'

import React from 'react'
import { BookingFlightOption } from '@/types/flights'
import { FlightCard } from './flight-card-new'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface FlightListChatProps {
  flights: BookingFlightOption[]
  searchId?: string | null
  className?: string
}

export function FlightListChat({ flights, searchId, className }: FlightListChatProps) {
  const isMobile = useIsMobile()

  if (!flights || flights.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Results Summary */}
      <div className="text-sm text-gray-600 border-b pb-2">
        {flights.length} flight{flights.length !== 1 ? 's' : ''} found
      </div>

      {/* Flight Cards */}
      <div className="space-y-3">
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            searchId={searchId || null}
            className="shadow-sm"
          />
        ))}
      </div>
    </div>
  )
}