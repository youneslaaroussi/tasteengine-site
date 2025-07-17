'use client'

import { useState, useCallback, useRef } from 'react'
import { BookingFlightOption, ProgressiveSearchResponse } from '@/types/flights'

export function useFlightSearch() {
  const [searchId, setSearchId] = useState<string | null>(null)
  const [flights, setFlights] = useState<BookingFlightOption[]>([])
  const [pricingTokens, setPricingTokens] = useState<Record<string, string>>({})
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const pollingInterval = 6000 // 6 seconds

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startSearch = useCallback((newSearchId: string) => {
    stopPolling()
    setSearchId(newSearchId)
    setFlights([])
    setPricingTokens({})
    setIsSearching(true)
    setError(null)

    const pollForResults = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/search/${newSearchId}/results`
        )
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Search expired or not found')
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: ProgressiveSearchResponse = await response.json()
        const { status, newFlights, pricingTokens: newPricingTokens, hasMoreResults, nextPollAfter } = data

        // Update flights (merge with existing to avoid duplicates)
        setFlights(prev => {
          const flightMap = new Map<string, BookingFlightOption>()
          
          // Add existing flights
          prev.forEach(flight => flightMap.set(flight.id, flight))
          
          // Add new flights (will overwrite duplicates)
          newFlights.forEach(flight => flightMap.set(flight.id, flight))
          
          return Array.from(flightMap.values())
        })

        // Update pricing tokens
        setPricingTokens(prev => ({ ...prev, ...newPricingTokens }))

        // Continue polling if more results expected
        if (hasMoreResults && status.status === 'searching') {
          pollingRef.current = setTimeout(
            pollForResults, 
            nextPollAfter ? nextPollAfter * 1000 : pollingInterval
          )
        } else {
          setIsSearching(false)
        }
      } catch (err) {
        console.error('Flight search polling error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while searching for flights')
        setIsSearching(false)
        stopPolling()
      }
    }

    // Start polling immediately
    pollForResults()
  }, [stopPolling, pollingInterval])

  const resetSearch = useCallback(() => {
    stopPolling()
    setSearchId(null)
    setFlights([])
    setPricingTokens({})
    setIsSearching(false)
    setError(null)
  }, [stopPolling])

  return {
    searchId,
    flights,
    pricingTokens,
    isSearching,
    error,
    startSearch,
    resetSearch,
  }
}