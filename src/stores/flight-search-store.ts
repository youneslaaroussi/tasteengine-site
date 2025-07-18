import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BookingFlightOption, SearchStatus, ProgressiveSearchResponse } from '@/types/flights'

export type SortOption = 'default' | 'cheapest' | 'fastest' | 'shortest'

export type FilterOptions = {
  maxPrice?: number
  maxStops?: number
  airlines?: string[]
  departureTimeRange?: [number, number] // hours in 24h format
  arrivalTimeRange?: [number, number]
  minDuration?: number // minutes
  maxDuration?: number // minutes
}

interface FlightSearchState {
  // Search state
  searchId: string | null
  searchStatus: SearchStatus | null
  
  // Flight data
  flights: BookingFlightOption[]
  pricingTokens: Record<string, string>
  
  // UI state
  isSearching: boolean
  error: string | null
  
  // Sorting and filtering
  sortBy: SortOption
  filters: FilterOptions
  
  // Pagination and virtualization
  displayedFlights: BookingFlightOption[]
  hasMoreResults: boolean
  
  // Performance optimization
  lastUpdate: number
  pollInterval: number | null
}

interface FlightSearchActions {
  // Search management
  startSearch: (searchId: string) => void
  stopSearch: () => void
  resetSearch: () => void
  
  // Flight data updates
  updateFlights: (response: ProgressiveSearchResponse) => void
  addFlights: (newFlights: BookingFlightOption[], pricingTokens: Record<string, string>) => void
  
  // Sorting and filtering
  setSortBy: (sortBy: SortOption) => void
  setFilters: (filters: FilterOptions) => void
  applyFiltersAndSort: () => void
  
  // Error handling
  setError: (error: string | null) => void
  
  // Performance
  setPollInterval: (interval: number | null) => void
  updateLastUpdate: () => void
}

type FlightSearchStore = FlightSearchState & FlightSearchActions

const initialState: FlightSearchState = {
  searchId: null,
  searchStatus: null,
  flights: [],
  pricingTokens: {},
  isSearching: false,
  error: null,
  sortBy: 'default',
  filters: {},
  displayedFlights: [],
  hasMoreResults: false,
  lastUpdate: 0,
  pollInterval: null,
}

// Helper functions for sorting
const sortFlights = (flights: BookingFlightOption[], sortBy: SortOption): BookingFlightOption[] => {
  if (sortBy === 'default') return flights

  return [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'cheapest':
        return a.price - b.price
      
      case 'fastest':
        const getDurationMinutes = (duration: string): number => {
          const match = duration.match(/(\d+)h\s*(\d+)?m?/)
          if (match) {
            const hours = parseInt(match[1]) || 0
            const minutes = parseInt(match[2]) || 0
            return hours * 60 + minutes
          }
          return Number.MAX_SAFE_INTEGER
        }
        return getDurationMinutes(a.totalDuration) - getDurationMinutes(b.totalDuration)
      
      case 'shortest':
        return a.totalStops - b.totalStops
      
      default:
        return 0
    }
  })
}

// Helper functions for filtering
const filterFlights = (flights: BookingFlightOption[], filters: FilterOptions): BookingFlightOption[] => {
  return flights.filter((flight) => {
    // Price filter
    if (filters.maxPrice && flight.price > filters.maxPrice) {
      return false
    }
    
    // Stops filter
    if (filters.maxStops !== undefined && flight.totalStops > filters.maxStops) {
      return false
    }
    
    // Airlines filter
    if (filters.airlines && filters.airlines.length > 0) {
      const flightAirlines = flight.segments.map(s => s.airline)
      const hasAllowedAirline = flightAirlines.some(airline => 
        filters.airlines!.includes(airline)
      )
      if (!hasAllowedAirline) {
        return false
      }
    }
    
    // Duration filter
    if (filters.minDuration || filters.maxDuration) {
      const getDurationMinutes = (duration: string): number => {
        const match = duration.match(/(\d+)h\s*(\d+)?m?/)
        if (match) {
          const hours = parseInt(match[1]) || 0
          const minutes = parseInt(match[2]) || 0
          return hours * 60 + minutes
        }
        return 0
      }
      
      const durationMinutes = getDurationMinutes(flight.totalDuration)
      
      if (filters.minDuration && durationMinutes < filters.minDuration) {
        return false
      }
      
      if (filters.maxDuration && durationMinutes > filters.maxDuration) {
        return false
      }
    }
    
    return true
  })
}

export const useFlightSearchStore = create<FlightSearchStore>()(
  immer((set, get) => ({
    ...initialState,
    
    startSearch: (searchId: string) => {
      set((state) => {
        state.searchId = searchId
        state.isSearching = true
        state.error = null
        state.flights = []
        state.pricingTokens = {}
        state.displayedFlights = []
        state.hasMoreResults = true
        state.lastUpdate = Date.now()
        state.pollInterval = 5000 // Start with 5 second polling
      })
    },
    
    stopSearch: () => {
      set((state) => {
        state.isSearching = false
        state.pollInterval = null
      })
    },
    
    resetSearch: () => {
      set((state) => {
        Object.assign(state, initialState)
      })
    },
    
    updateFlights: (response: ProgressiveSearchResponse) => {
      set((state) => {
        state.searchStatus = response.status
        state.hasMoreResults = response.hasMoreResults
        
        // Update flights and pricing tokens
        response.newFlights.forEach((flight) => {
          const existingIndex = state.flights.findIndex(f => f.id === flight.id)
          if (existingIndex === -1) {
            state.flights.push(flight)
          } else {
            state.flights[existingIndex] = flight
          }
          
          if (response.pricingTokens[flight.id]) {
            state.pricingTokens[flight.id] = response.pricingTokens[flight.id]
          }
        })
        
        // Update search status
        const isCompleted = response.status.status === 'completed' || response.status.status === 'expired'
        state.isSearching = !isCompleted && response.hasMoreResults
        
        if (isCompleted) {
          state.pollInterval = null
        } else if (response.nextPollAfter) {
          state.pollInterval = response.nextPollAfter * 1000
        }
        
        state.lastUpdate = Date.now()
        
        // Re-apply filters and sorting
        const filtered = filterFlights(state.flights, state.filters)
        state.displayedFlights = sortFlights(filtered, state.sortBy)
      })
    },
    
    addFlights: (newFlights: BookingFlightOption[], pricingTokens: Record<string, string>) => {
      set((state) => {
        newFlights.forEach((flight) => {
          const existingIndex = state.flights.findIndex(f => f.id === flight.id)
          if (existingIndex === -1) {
            state.flights.push(flight)
          }
        })
        
        Object.assign(state.pricingTokens, pricingTokens)
        state.lastUpdate = Date.now()
        
        // Re-apply filters and sorting
        const filtered = filterFlights(state.flights, state.filters)
        state.displayedFlights = sortFlights(filtered, state.sortBy)
      })
    },
    
    setSortBy: (sortBy: SortOption) => {
      set((state) => {
        state.sortBy = sortBy
      })
      get().applyFiltersAndSort()
    },
    
    setFilters: (filters: FilterOptions) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters }
      })
      get().applyFiltersAndSort()
    },
    
    applyFiltersAndSort: () => {
      set((state) => {
        const filtered = filterFlights(state.flights, state.filters)
        state.displayedFlights = sortFlights(filtered, state.sortBy)
      })
    },
    
    setError: (error: string | null) => {
      set((state) => {
        state.error = error
        if (error) {
          state.isSearching = false
          state.pollInterval = null
        }
      })
    },
    
    setPollInterval: (interval: number | null) => {
      set((state) => {
        state.pollInterval = interval
      })
    },
    
    updateLastUpdate: () => {
      set((state) => {
        state.lastUpdate = Date.now()
      })
    },
  }))
)