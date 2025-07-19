'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useFlightSearch as useWorkerFlightSearch } from '@/hooks/use-flight-search'
import {
  useFlightSearchStore,
  SortOption,
  FilterOptions,
} from '@/stores/flight-search-store'
import { BookingFlightOption } from '@/types/flights'

interface FlightSearchContextType {
  searchId: string | null
  isSearching: boolean
  error: string | null
  flights: BookingFlightOption[]
  initiateSearch: (searchId: string) => void
  resetFlightSearch: () => void
  // These are from the store and should remain
  displayedFlights: BookingFlightOption[]
  pricingTokens: Record<string, string>
  hasMoreResults: boolean
  sortBy: SortOption
  filters: FilterOptions
  setSortBy: (sortBy: SortOption) => void
  setFilters: (filters: FilterOptions) => void
}

const FlightSearchContext = createContext<FlightSearchContextType | undefined>(
  undefined
)

interface FlightSearchProviderProps {
  children: ReactNode
}

export function FlightSearchProvider({ children }: FlightSearchProviderProps) {
  const {
    searchId,
    flights,
    isSearching,
    error,
    startSearch,
    resetSearch,
  } = useWorkerFlightSearch()

  const {
    displayedFlights,
    pricingTokens,
    hasMoreResults,
    sortBy,
    filters,
    setSortBy,
    setFilters,
  } = useFlightSearchStore()

  return (
    <FlightSearchContext.Provider
      value={{
        searchId,
        flights,
        isSearching,
        error,
        initiateSearch: startSearch,
        resetFlightSearch: resetSearch,
        // from store
        displayedFlights,
        pricingTokens,
        hasMoreResults,
        sortBy,
        filters,
        setSortBy,
        setFilters,
      }}
    >
      {children}
    </FlightSearchContext.Provider>
  )
}

export function useFlightSearch() {
  const context = useContext(FlightSearchContext)
  if (context === undefined) {
    throw new Error('useFlightSearch must be used within a FlightSearchProvider')
  }
  return context
}