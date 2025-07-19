'use client'

import React from 'react'
import { FlightSearchProvider } from '@/contexts/flight-search-provider'
import { FlightListChat } from './flight-list-chat'
import { FlightSearchStatus } from './flight-search-status'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface FlightSearchContainerProps {
  className?: string
  showStatus?: boolean
  enableVirtualization?: boolean
}

export function FlightSearchContainer({
  className,
  showStatus = true,
  enableVirtualization = true,
}: FlightSearchContainerProps) {
  const isMobile = useIsMobile()

  return (
    <FlightSearchProvider>
      <div className={cn('space-y-4', className)}>
        {/* Status Component */}
        {showStatus && (
          <div className={isMobile ? 'px-4' : undefined}>
            <FlightSearchStatus />
          </div>
        )}

        {/* Flight List */}
        <div className={isMobile ? 'px-4' : undefined}>
          {/* FlightListChat will be used by the chat interface */}
        </div>
      </div>
    </FlightSearchProvider>
  )
}

// Export individual components for direct use
export { FlightSearchProvider } from '@/contexts/flight-search-provider'
export { FlightListChat } from './flight-list-chat'
export { FlightCard } from './flight-card-new'
export { FlightSearchControls } from './flight-search-controls'
export { FlightSearchStatus } from './flight-search-status'

// Export hooks for external use
export { useFlightSearch } from '@/contexts/flight-search-provider'

// Export store for advanced use cases
export { useFlightSearchStore } from '@/stores/flight-search-store'
export type { SortOption, FilterOptions } from '@/stores/flight-search-store'