// Main container component
export { FlightSearchContainer } from './flight-search-container'

// Individual components
export { FlightSearchProvider } from '@/contexts/flight-search-provider'
export { FlightList } from './flight-list-new'
export { FlightListChat } from './flight-list-chat'
export { FlightCard } from './flight-card-new'
export { FlightSearchControls } from './flight-search-controls'
export { FlightSearchStatus } from './flight-search-status'

// Hooks
export {
  useFlightSearch,
  useFlightSearchState,
  useFlightSearchData,
  useFlightSearchActions,
  useFlightSearchFilters,
} from '@/contexts/flight-search-provider'

// Store and types
export { useFlightSearchStore } from '@/stores/flight-search-store'
export type { SortOption, FilterOptions } from '@/stores/flight-search-store'

// API service
export { flightApiService, FlightApiError } from '@/lib/flight-api'