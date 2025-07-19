'use client'

import React, { useState } from 'react'
import { BookingFlightOption } from '@/types/flights'
import { FlightCard } from './flight-card-new'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FlightListChatProps {
  flights: BookingFlightOption[]
  searchId?: string | null
  className?: string
}

type SortOption = 'default' | 'cheapest' | 'fastest' | 'shortest'

export function FlightListChat({ flights, searchId, className }: FlightListChatProps) {
  const isMobile = useIsMobile()
  const [showAll, setShowAll] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [isTransitioning, setIsTransitioning] = useState(false)

  if (!flights || flights.length === 0) {
    return null
  }

  // Handle sort change with simple fade transition
  const handleSortChange = (newSort: SortOption) => {
    if (newSort === sortBy) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setSortBy(newSort)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 150)
    }, 150)
  }

  // Sorting logic
  const sortFlights = (flights: BookingFlightOption[], sortOption: SortOption): BookingFlightOption[] => {
    if (sortOption === 'default') return flights

    return [...flights].sort((a, b) => {
      switch (sortOption) {
        case 'cheapest':
          return a.price - b.price
        
        case 'fastest':
          const getDurationMinutes = (duration: string): number => {
            const match = duration.match(/(\d+)h\s*(\d+)?m?/)
            if (match) {
              const hours = parseInt(match[1]) || 0
              const minutes = parseInt(match[2]) || 0
              return hours * 60 + minutes
            }
            return Number.MAX_SAFE_INTEGER
          }
          return getDurationMinutes(a.totalDuration) - getDurationMinutes(b.totalDuration)
        
        case 'shortest':
          return a.totalStops - b.totalStops
        
        default:
          return 0
      }
    })
  }

  // Apply sorting
  const sortedFlights = sortFlights(flights, sortBy)

  // Configuration for max visible flights and fade effect
  const maxVisible = 3
  const shouldShowFade = sortedFlights.length > maxVisible
  const displayedFlights = showAll ? sortedFlights : sortedFlights.slice(0, maxVisible)
  const hasMoreFlights = sortedFlights.length > maxVisible

  const sortOptions = [
    { value: 'default', label: 'Best Match', icon: '⭐' },
    { value: 'cheapest', label: 'Cheapest', icon: '💰' },
    { value: 'fastest', label: 'Fastest', icon: '⚡' },
    { value: 'shortest', label: 'Fewest Stops', icon: '🎯' },
  ] as const

  return (
    <div className={cn('space-y-3', className)}>
      {/* Results Summary */}
      <div className="text-sm text-gray-600 border-b pb-2">
        {flights.length} flight{flights.length !== 1 ? 's' : ''} found
      </div>

      {/* Sorting Controls */}
      <div className="flex flex-wrap gap-2 pb-3 border-b">
        {sortOptions.map((option) => (
          <Button
            key={option.value}
            variant={sortBy === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange(option.value as SortOption)}
            disabled={isTransitioning}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
              sortBy === option.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
              isTransitioning && 'opacity-70 cursor-wait'
            )}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </Button>
        ))}
      </div>

      {/* Flight Cards Container with fade effect */}
      <div className="relative">
        <div 
          className={cn(
            'space-y-3 transition-all duration-300',
            !showAll && shouldShowFade ? 'max-h-[800px] overflow-hidden' : '',
            isTransitioning ? 'opacity-30 blur-sm' : 'opacity-100 blur-none'
          )}
        >
          {displayedFlights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            searchId={searchId || null}
            className="shadow-sm"
          />
        ))}
        </div>

        {/* Fade overlay */}
        {shouldShowFade && !showAll && (
          <div 
            className={cn(
              'absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-300',
              isTransitioning ? 'opacity-30' : 'opacity-100'
            )}
          />
        )}

        {/* Show more/less button */}
        {hasMoreFlights && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              disabled={isTransitioning}
              className={cn(
                'px-4 relative z-20 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 rounded-full transition-colors',
                isTransitioning && 'opacity-70 cursor-wait'
              )}
            >
              {showAll ? (
                <>
                  Show Less
                  <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  Show All {sortedFlights.length} Flights
                  <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}