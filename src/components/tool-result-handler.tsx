'use client'

import { memo } from 'react'
import { Plane, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const FlightResults = memo(({ data }: { data: any }) => {
  if (!data || !data.flights || !Array.isArray(data.flights)) {
    return null
  }

  return (
    <div className="space-y-3 mt-4">
      <h4 className="font-medium text-gray-900">Flight Options</h4>
      {data.flights.slice(0, 3).map((flight: any, index: number) => (
        <div key={index} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium">
                {flight.origin} → {flight.destination}
              </div>
              <div className="text-sm text-gray-600">
                {flight.airline} {flight.flightNumber}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">
                {flight.currency}{flight.price}
              </div>
              <div className="text-sm text-gray-600">
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{flight.departureTime}</span>
            <span>{flight.duration}</span>
            <span>{flight.arrivalTime}</span>
          </div>
        </div>
      ))}
      {data.flights.length > 3 && (
        <div className="text-sm text-gray-600 text-center">
          And {data.flights.length - 3} more flights...
        </div>
      )}
    </div>
  )
})

FlightResults.displayName = 'FlightResults'