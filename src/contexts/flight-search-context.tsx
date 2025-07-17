'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useFlightSearch } from '@/hooks/use-flight-search'
import { BookingFlightOption } from '@/types/flights'

interface FlightSearchContextType {
  searchId: string | null
  flights: BookingFlightOption[]
  pricingTokens: Record<string, string>
  isSearching: boolean
  error: string | null
  startSearch: (searchId: string) => void
  resetSearch: () => void
}

const FlightSearchContext = createContext<FlightSearchContextType | undefined>(undefined)

interface FlightSearchProviderProps {
  children: ReactNode
}

export function FlightSearchProvider({ children }: FlightSearchProviderProps) {
  const flightSearch = useFlightSearch()

  return (
    <FlightSearchContext.Provider value={flightSearch}>
      {children}
    </FlightSearchContext.Provider>
  )
}

export function useFlightSearchContext() {
  const context = useContext(FlightSearchContext)
  if (context === undefined) {
    throw new Error('useFlightSearchContext must be used within a FlightSearchProvider')
  }
  return context
}