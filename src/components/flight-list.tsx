
'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { BookingFlightOption } from '@/types/flights'
import { FlightCard } from './flight-card'

interface FlightListProps {
  flights: BookingFlightOption[]
  searchId: string
}

export function FlightList({ flights, searchId }: FlightListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: flights.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 370, // Estimate of flight card's height
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-y-auto custom-scrollbar">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const flight = flights[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                padding: '10px 0',
              }}
            >
              <FlightCard flight={flight} searchId={searchId} />
            </div>
          )
        })}
      </div>
    </div>
  )
} 