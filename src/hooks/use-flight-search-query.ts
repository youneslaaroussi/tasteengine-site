'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { flightApiService, FlightApiError } from '@/lib/flight-api'
import { useFlightSearchStore } from '@/stores/flight-search-store'
import { useAnalytics } from './use-analytics'

const FLIGHT_SEARCH_QUERY_KEY = 'flight-search'

interface UseFlightSearchQueryOptions {
  enabled?: boolean
  onError?: (error: FlightApiError) => void
  onSuccess?: () => void
}

export function useFlightSearchQuery(options: UseFlightSearchQueryOptions = {}) {
  const { trackEvent } = useAnalytics()
  const queryClient = useQueryClient()
  const retryAttemptsRef = useRef(0)
  const lastErrorRef = useRef<FlightApiError | null>(null)
  
  const {
    searchId,
    isSearching,
    pollInterval,
    updateFlights,
    setError,
    setPollInterval,
    stopSearch,
  } = useFlightSearchStore()

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [FLIGHT_SEARCH_QUERY_KEY, searchId],
    queryFn: async () => {
      if (!searchId) return null
      
      try {
        const response = await flightApiService.fetchFlightResults(searchId)
        
        // Reset retry attempts on successful request
        retryAttemptsRef.current = 0
        lastErrorRef.current = null
        
        return response
      } catch (error) {
        if (error instanceof FlightApiError) {
          lastErrorRef.current = error
          
          // Track API errors
          trackEvent('api_error', 'flight_search', error.code || 'unknown', 1)
          
          throw error
        }
        throw new FlightApiError('Unknown error occurred')
      }
    },
    enabled: Boolean(searchId && isSearching && (options.enabled !== false)),
    
    // Polling configuration
    refetchInterval: (query) => {
      const data = query.state.data
      const error = query.state.error as FlightApiError | null

      // If there's an error, handle retry logic
      if (error && FlightApiService.isRetryableError(error)) {
        const retryDelay = FlightApiService.getRetryDelay(error, retryAttemptsRef.current)
        retryAttemptsRef.current++
        
        // Max 5 retry attempts
        if (retryAttemptsRef.current <= 5) {
          return retryDelay
        }
      }

      // If no data or search is not active, stop polling
      if (!data || !isSearching) {
        return false
      }

      // If search is complete, stop polling
      const isComplete = data.status.status === 'completed' || data.status.status === 'expired'
      if (isComplete || !data.hasMoreResults) {
        return false
      }

      // Use server-suggested poll interval or default
      return pollInterval || 5000
    },

    // Disable automatic refetches except polling
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Retry on reconnection
    refetchOnMount: false,
    
    // Error retry configuration
    retry: (failureCount, error) => {
      const flightError = error as FlightApiError
      
      // Don't retry non-retryable errors
      if (!flightApiService.isRetryableError(flightError)) {
        return false
      }
      
      // Max 3 immediate retries, then rely on polling retry logic
      return failureCount < 3
    },
    
    retryDelay: (attemptIndex, error) => {
      const flightError = error as FlightApiError
      return flightApiService.getRetryDelay(flightError, attemptIndex)
    },

    // Cache configuration
    staleTime: 1000, // Data is fresh for 1 second
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  // Update store when data changes
  useEffect(() => {
    if (data) {
      updateFlights(data)
      options.onSuccess?.()
    }
  }, [data, updateFlights, options])

  // Handle errors
  useEffect(() => {
    if (error instanceof FlightApiError) {
      console.error('Flight search error:', error.message, error.code)
      
      // Set error in store
      setError(error.message)
      
      // Stop search for non-retryable errors
      if (!flightApiService.isRetryableError(error)) {
        stopSearch()
      }
      
      options.onError?.(error)
    }
  }, [error, setError, stopSearch, options])

  // Cleanup function
  const cleanup = useCallback(() => {
    retryAttemptsRef.current = 0
    lastErrorRef.current = null
    queryClient.removeQueries({ queryKey: [FLIGHT_SEARCH_QUERY_KEY] })
  }, [queryClient])

  // Cancel search function
  const cancelSearch = useCallback(async () => {
    if (searchId) {
      try {
        await flightApiService.cancelSearch(searchId)
        trackEvent('flight_search', 'cancel', searchId, 1)
      } catch (error) {
        console.warn('Failed to cancel search:', error)
      }
    }
    
    stopSearch()
    cleanup()
  }, [searchId, stopSearch, cleanup, trackEvent])

  // Manual refresh function
  const refreshSearch = useCallback(() => {
    if (searchId && isSearching) {
      retryAttemptsRef.current = 0
      lastErrorRef.current = null
      refetch()
    }
  }, [searchId, isSearching, refetch])

  return {
    // Data
    data,
    
    // Loading states
    isLoading,
    isFetching,
    isSearching,
    
    // Error state
    error: error as FlightApiError | null,
    lastError: lastErrorRef.current,
    retryAttempts: retryAttemptsRef.current,
    
    // Actions
    cancelSearch,
    refreshSearch,
    cleanup,
    
    // Status
    searchId,
  }
}

// Hook for managing search lifecycle
export function useFlightSearchManager() {
  const { trackEvent } = useAnalytics()
  const { startSearch, resetSearch } = useFlightSearchStore()
  
  const query = useFlightSearchQuery({
    onError: (error) => {
      console.error('Flight search failed:', error.message)
    },
    onSuccess: () => {
      // Track successful data fetch
      trackEvent('flight_search', 'data_received', 'success', 1)
    },
  })

  const initiateSearch = useCallback((searchId: string) => {
    trackEvent('flight_search', 'start', searchId, 1)
    startSearch(searchId)
  }, [startSearch, trackEvent])

  const resetFlightSearch = useCallback(() => {
    query.cleanup()
    resetSearch()
    trackEvent('flight_search', 'reset', 'manual', 1)
  }, [query, resetSearch, trackEvent])

  return {
    ...query,
    initiateSearch,
    resetFlightSearch,
  }
}