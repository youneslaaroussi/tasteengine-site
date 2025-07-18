'use client'

import React from 'react'
import { FlightSearchProvider } from '@/contexts/flight-search-provider'
import { FlightList } from './flight-list-new'
import { FlightSearchStatus } from './flight-search-status'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface FlightSearchContainerProps {
  className?: string
  showStatus?: boolean
  showDetailedStats?: boolean
  enableVirtualization?: boolean
}

export function FlightSearchContainer({
  className,
  showStatus = true,
  showDetailedStats = false,
  enableVirtualization = true,
}: FlightSearchContainerProps) {
  const isMobile = useIsMobile()

  return (
    <FlightSearchProvider>
      <div className={cn('space-y-4', className)}>
        {/* Status Component */}
        {showStatus && (
          <FlightSearchStatus 
            showDetailedStats={showDetailedStats}
            className={isMobile ? 'px-4' : undefined}
          />
        )}

        {/* Flight List */}
        <FlightList 
          showControls={true}
          itemHeight={isMobile ? 180 : 220}
          overscan={3}
          className={isMobile ? 'px-4' : undefined}
        />
      </div>
    </FlightSearchProvider>
  )
}

// Export individual components for direct use
export { FlightSearchProvider } from '@/contexts/flight-search-provider'
export { FlightList } from './flight-list-new'
export { FlightCard } from './flight-card-new'
export { FlightSearchControls } from './flight-search-controls'
export { FlightSearchStatus } from './flight-search-status'

// Export hooks for external use
export {
  useFlightSearch,
  useFlightSearchState,
  useFlightSearchData,
  useFlightSearchActions,
  useFlightSearchFilters,
} from '@/contexts/flight-search-provider'

// Export store for advanced use cases
export { useFlightSearchStore } from '@/stores/flight-search-store'
export type { SortOption, FilterOptions } from '@/stores/flight-search-store'