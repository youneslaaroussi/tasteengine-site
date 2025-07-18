'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { FlightCard } from './flight-card-new'
import { FlightSearchControls } from './flight-search-controls'
import { useFlightSearchData, useFlightSearchState } from '@/contexts/flight-search-provider'
import { useIsMobile } from '@/hooks/use-mobile'
import { 
  AlertCircle, 
  Search, 
  Plane, 
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FlightListProps {
  className?: string
  showControls?: boolean
  itemHeight?: number
  overscan?: number
}

interface EmptyStateProps {
  type: 'no-search' | 'searching' | 'no-results' | 'error'
  error?: string | null
  onRetry?: () => void
}

const EmptyState = ({ type, error, onRetry }: EmptyStateProps) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-search':
        return {
          icon: <Search className="w-12 h-12 text-gray-400" />,
          title: 'Start Your Flight Search',
          description: 'Enter your travel details to find the best flight deals.',
          action: null,
        }
      
      case 'searching':
        return {
          icon: <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />,
          title: 'Searching for Flights',
          description: 'We\'re scanning hundreds of airlines and travel sites to find you the best deals.',
          action: null,
        }
      
      case 'no-results':
        return {
          icon: <Plane className="w-12 h-12 text-gray-400" />,
          title: 'No Flights Found',
          description: 'Try adjusting your search criteria or check different dates.',
          action: (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Search
            </Button>
          ),
        }
      
      case 'error':
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          title: 'Search Error',
          description: error || 'Something went wrong while searching for flights.',
          action: (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          ),
        }
    }
  }

  const content = getEmptyStateContent()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {content.icon}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        {content.title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
        {content.description}
      </p>
      {content.action && (
        <div className="mt-4">
          {content.action}
        </div>
      )}
    </div>
  )
}

interface LoadingIndicatorProps {
  isSearching: boolean
  isFetching: boolean
  flightCount: number
}

const LoadingIndicator = ({ isSearching, isFetching, flightCount }: LoadingIndicatorProps) => {
  if (!isSearching && !isFetching) return null

  return (
    <div className="flex items-center justify-center py-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
        <div className="text-sm text-blue-800">
          {isSearching ? (
            <span>
              Searching for flights... {flightCount > 0 && `(${flightCount} found)`}
            </span>
          ) : (
            <span>Updating results...</span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ConnectionStatusProps {
  isOnline: boolean
}

const ConnectionStatus = ({ isOnline }: ConnectionStatusProps) => {
  if (isOnline) return null

  return (
    <div className="flex items-center justify-center py-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-orange-600" />
        <span className="text-sm text-orange-800">
          You're offline. Some features may not work properly.
        </span>
      </div>
    </div>
  )
}

export function FlightList({ 
  className, 
  showControls = true,
  itemHeight = 200,
  overscan = 5,
}: FlightListProps) {
  const isMobile = useIsMobile()
  const { displayedFlights, hasMoreResults } = useFlightSearchData()
  const { searchId, isSearching, isLoading, isFetching, error } = useFlightSearchState()
  
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({})
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  // Track online status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleBookingError = useCallback((flightId: string, errorMessage: string) => {
    setBookingErrors(prev => ({
      ...prev,
      [flightId]: errorMessage,
    }))
  }, [])

  const handleRetry = useCallback(() => {
    // This would trigger a retry - implementation depends on your retry logic
    window.location.reload()
  }, [])

  // Determine empty state type
  const getEmptyStateType = (): EmptyStateProps['type'] => {
    if (error) return 'error'
    if (!searchId) return 'no-search'
    if (isSearching && displayedFlights.length === 0) return 'searching'
    if (displayedFlights.length === 0) return 'no-results'
    return 'no-search' // fallback
  }

  // Virtualization setup
  const parentRef = React.useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: displayedFlights.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? itemHeight * 0.8 : itemHeight),
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Show empty state if no flights
  if (displayedFlights.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {showControls && <FlightSearchControls />}
        <ConnectionStatus isOnline={isOnline} />
        <LoadingIndicator 
          isSearching={isSearching} 
          isFetching={isFetching}
          flightCount={displayedFlights.length}
        />
        <EmptyState 
          type={getEmptyStateType()} 
          error={error}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {showControls && <FlightSearchControls />}
      
      <ConnectionStatus isOnline={isOnline} />
      
      <LoadingIndicator 
        isSearching={isSearching} 
        isFetching={isFetching}
        flightCount={displayedFlights.length}
      />

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          {displayedFlights.length} flight{displayedFlights.length !== 1 ? 's' : ''} found
          {hasMoreResults && isSearching && ' (more results loading...)'}
        </span>
        {!isOnline && (
          <div className="flex items-center space-x-1 text-orange-600">
            <WifiOff size={14} />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* Virtualized Flight List */}
      <div
        ref={parentRef}
        className={cn(
          'overflow-auto rounded-lg border',
          isMobile ? 'max-h-[70vh]' : 'max-h-[600px]'
        )}
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const flight = displayedFlights[virtualItem.index]
            
            return (
              <div
                key={flight.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-2">
                  <FlightCard
                    flight={flight}
                    searchId={searchId}
                    onBookingError={(error) => handleBookingError(flight.id, error)}
                  />
                  {bookingErrors[flight.id] && (
                    <div className="mt-2 bg-red-50 border border-red-200 text-red-800 text-sm p-2 rounded">
                      {bookingErrors[flight.id]}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Load More Indicator */}
      {hasMoreResults && isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading more flights...</span>
          </div>
        </div>
      )}

      {/* Performance Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
          <div>Virtual items: {virtualItems.length} / {displayedFlights.length}</div>
          <div>Scroll height: {virtualizer.getTotalSize()}px</div>
          <div>Online: {isOnline ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  )
}