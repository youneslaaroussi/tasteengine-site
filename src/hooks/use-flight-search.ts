'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import * as Comlink from 'comlink'
import { BookingFlightOption, ProgressiveSearchResponse } from '@/types/flights'
import { useAnalytics } from './use-analytics'
import { getFlightSearchWorker } from '@/workers/flight-search.worker.factory'
import { useFlightSearchStore } from '@/stores/flight-search-store'

export function useFlightSearch() {
  const { trackEvent } = useAnalytics()
  const [searchId, setSearchId] = useState<string | null>(null)
  const [flights, setFlights] = useState<BookingFlightOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Access store methods for coordination
  const { updateFlights: updateStoreFlights, startSearch: startStoreSearch, stopSearch: stopStoreSearch } = useFlightSearchStore()

  const onUpdate = useCallback((data: ProgressiveSearchResponse) => {
    console.log('[FLIGHT_SEARCH] Worker onUpdate - new flights:', data.newFlights.length);
    setFlights(data.newFlights);
    // Also update the store for coordination
    updateStoreFlights(data);
  }, [updateStoreFlights])

  const onComplete = useCallback((data: ProgressiveSearchResponse) => {
    console.log('[FLIGHT_SEARCH] Worker onComplete - final flights:', data.newFlights.length);
    setFlights(data.newFlights);
    setIsSearching(false);
    // Also update the store
    updateStoreFlights(data);
    stopStoreSearch();
  }, [updateStoreFlights, stopStoreSearch])

  const onError = useCallback((errorMessage: string) => {
    console.error('[FLIGHT_SEARCH] Worker error:', errorMessage);
    setError(errorMessage);
    setIsSearching(false);
    stopStoreSearch();
  }, [stopStoreSearch])

  const startSearch = useCallback(
    async (newSearchId: string) => {
      console.log('[FLIGHT_SEARCH] Starting search with ID:', newSearchId);
      trackEvent('flight_search', 'flights', 'start_search', 1)
      setSearchId(newSearchId)
      setFlights([])
      setIsSearching(true)
      setError(null)

      // Coordinate with store
      startStoreSearch(newSearchId);

      const worker = getFlightSearchWorker()
      if (worker) {
        await worker.startSearch(
          newSearchId,
          Comlink.proxy(onUpdate),
          Comlink.proxy(onComplete),
          Comlink.proxy(onError)
        )
      } else {
        setError('Flight search worker is not available.')
        setIsSearching(false)
        stopStoreSearch();
      }
    },
    [trackEvent, onUpdate, onComplete, onError, startStoreSearch, stopStoreSearch]
  )

  const resetSearch = useCallback(() => {
    console.log('[FLIGHT_SEARCH] Resetting search');
    setSearchId(null)
    setFlights([])
    setIsSearching(false)
    setError(null)
  }, [])

  return {
    searchId,
    flights,
    isSearching,
    error,
    startSearch,
    resetSearch,
  }
}