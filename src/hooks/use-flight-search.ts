'use client'

import { useState, useCallback, useRef } from 'react'
import * as Comlink from 'comlink'
import { BookingFlightOption, ProgressiveSearchResponse } from '@/types/flights'
import { useAnalytics } from './use-analytics'
import { getFlightSearchWorker } from '@/workers/flight-search.worker.factory'

export function useFlightSearch() {
  const { trackEvent } = useAnalytics()
  const [searchId, setSearchId] = useState<string | null>(null)
  const [flights, setFlights] = useState<BookingFlightOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onUpdate = useCallback((data: ProgressiveSearchResponse) => {
    setFlights(data.newFlights)
  }, [])

  const onComplete = useCallback((data: ProgressiveSearchResponse) => {
    setFlights(data.newFlights)
    setIsSearching(false)
  }, [])

  const onError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setIsSearching(false)
  }, [])

  const startSearch = useCallback(
    async (newSearchId: string) => {
      trackEvent('flight_search', 'flights', 'start_search', 1)
      setSearchId(newSearchId)
      setFlights([])
      setIsSearching(true)
      setError(null)

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
      }
    },
    [trackEvent, onUpdate, onComplete, onError]
  )

  const resetSearch = useCallback(() => {
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