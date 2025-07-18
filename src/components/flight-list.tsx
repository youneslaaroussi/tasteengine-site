
'use client'

import { useState, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual' // Keep package installed but unused
import { BookingFlightOption } from '@/types/flights'
import { FlightCard } from './flight-card'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, DollarSign, Clock } from 'lucide-react'

interface FlightListProps {
  flights: BookingFlightOption[]
  searchId: string
}

type SortOption = 'default' | 'cheapest' | 'fastest'

export function FlightList({ flights, searchId }: FlightListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default')

  const sortedFlights = useMemo(() => {
    if (sortBy === 'default') return flights

    return [...flights].sort((a, b) => {
      if (sortBy === 'cheapest') {
        return a.price - b.price
      }
      
      if (sortBy === 'fastest') {
        // Convert duration to minutes for comparison
        const getDurationInMinutes = (duration: string) => {
          const match = duration.match(/(\d+)h\s*(\d+)?m?/)
          if (match) {
            const hours = parseInt(match[1]) || 0
            const minutes = parseInt(match[2]) || 0
            return hours * 60 + minutes
          }
          return 0
        }
        
        const aDuration = getDurationInMinutes(a.totalDuration)
        const bDuration = getDurationInMinutes(b.totalDuration)
        return aDuration - bDuration
      }
      
      return 0
    })
  }, [flights, sortBy])

  return (
    <div className="space-y-4">
      {/* Sorting Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={sortBy === 'default' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('default')}
          className="flex items-center gap-2"
        >
          <ArrowUpDown size={16} />
          Default
        </Button>
        <Button
          variant={sortBy === 'cheapest' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('cheapest')}
          className="flex items-center gap-2"
        >
          <DollarSign size={16} />
          Cheapest
        </Button>
        <Button
          variant={sortBy === 'fastest' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('fastest')}
          className="flex items-center gap-2"
        >
          <Clock size={16} />
          Fastest
        </Button>
      </div>

      {/* Flight Results */}
      <div className="text-sm text-gray-600 mb-2">
        {sortedFlights.length} flight{sortedFlights.length !== 1 ? 's' : ''} found
        {sortBy !== 'default' && (
          <span className="ml-2 text-blue-600">
            (sorted by {sortBy === 'cheapest' ? 'price' : 'duration'})
          </span>
        )}
      </div>

      {/* Flight Cards */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {sortedFlights.map((flight, index) => (
          <div key={flight.id || index} className="px-1">
            <FlightCard flight={flight} searchId={searchId} />
          </div>
        ))}
      </div>
    </div>
  )
} 