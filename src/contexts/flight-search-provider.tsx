'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useFlightSearchManager } from '@/hooks/use-flight-search-query'
import { useFlightSearchStore, SortOption, FilterOptions } from '@/stores/flight-search-store'
import { BookingFlightOption } from '@/types/flights'
import { FlightApiError } from '@/lib/flight-api'

interface FlightSearchContextType {
  // Search state
  searchId: string | null
  isSearching: boolean
  isLoading: boolean
  isFetching: boolean
  error: string | null
  
  // Flight data
  flights: BookingFlightOption[]
  displayedFlights: BookingFlightOption[]
  pricingTokens: Record<string, string>
  hasMoreResults: boolean
  
  // Sorting and filtering
  sortBy: SortOption
  filters: FilterOptions
  
  // Actions
  initiateSearch: (searchId: string) => void
  cancelSearch: () => Promise<void>
  resetSearch: () => void
  refreshSearch: () => void
  
  // Sorting and filtering actions
  setSortBy: (sortBy: SortOption) => void
  setFilters: (filters: FilterOptions) => void
  
  // Status info
  retryAttempts: number
  lastError: FlightApiError | null
}

const FlightSearchContext = createContext<FlightSearchContextType | undefined>(undefined)

interface FlightSearchProviderProps {
  children: ReactNode
}

export function FlightSearchProvider({ children }: FlightSearchProviderProps) {
  // Get data from Zustand store
  const {
    searchId,
    isSearching: storeIsSearching,
    error: storeError,
    flights,
    displayedFlights,
    pricingTokens,
    hasMoreResults,
    sortBy,
    filters,
    setSortBy,
    setFilters,
    resetSearch: storeResetSearch,
  } = useFlightSearchStore()
  
  // Get query state and actions
  const {
    isLoading,
    isFetching,
    error: queryError,
    lastError,
    retryAttempts,
    initiateSearch,
    cancelSearch,
    refreshSearch,
    resetFlightSearch,
  } = useFlightSearchManager()

  // Combine error states
  const combinedError = storeError || queryError?.message || null

  const contextValue: FlightSearchContextType = {
    // Search state
    searchId,
    isSearching: storeIsSearching,
    isLoading,
    isFetching,
    error: combinedError,
    
    // Flight data
    flights,
    displayedFlights,
    pricingTokens,
    hasMoreResults,
    
    // Sorting and filtering
    sortBy,
    filters,
    
    // Actions
    initiateSearch,
    cancelSearch,
    resetSearch: resetFlightSearch,
    refreshSearch,
    
    // Sorting and filtering actions
    setSortBy,
    setFilters,
    
    // Status info
    retryAttempts,
    lastError,
  }

  return (
    <FlightSearchContext.Provider value={contextValue}>
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

// Selector hooks for performance optimization
export function useFlightSearchState() {
  const { searchId, isSearching, isLoading, isFetching, error } = useFlightSearch()
  return { searchId, isSearching, isLoading, isFetching, error }
}

export function useFlightSearchData() {
  const { flights, displayedFlights, pricingTokens, hasMoreResults } = useFlightSearch()
  return { flights, displayedFlights, pricingTokens, hasMoreResults }
}

export function useFlightSearchActions() {
  const { 
    initiateSearch, 
    cancelSearch, 
    resetSearch, 
    refreshSearch,
    setSortBy,
    setFilters,
  } = useFlightSearch()
  
  return { 
    initiateSearch, 
    cancelSearch, 
    resetSearch, 
    refreshSearch,
    setSortBy,
    setFilters,
  }
}

export function useFlightSearchFilters() {
  const { sortBy, filters, setSortBy, setFilters } = useFlightSearch()
  return { sortBy, filters, setSortBy, setFilters }
}