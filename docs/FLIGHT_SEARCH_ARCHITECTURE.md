# Flight Search Architecture - Rebuilt from Scratch

This document describes the new flight search system that has been completely rebuilt following best practices and using modern React patterns.

## Overview

The previous flight search implementation was experiencing crashes and performance issues. The new system has been rebuilt from the ground up with:

- **Zustand with Immer** for state management
- **TanStack Query** for API calls and caching
- **React Context** for component integration
- **Separation of concerns** for maintainable code
- **Mobile-first responsive design**
- **Performance optimizations** with virtualization

## Architecture Components

### 1. State Management - Zustand Store

**File**: `src/stores/flight-search-store.ts`

- Uses Zustand with Immer middleware for immutable updates
- Manages flight data, search state, sorting, and filtering
- Optimized for performance with selective updates
- Includes helper functions for sorting and filtering logic

**Key Features**:
- Real-time flight data updates
- Client-side sorting (cheapest, fastest, shortest)
- Advanced filtering (price, stops, airlines, duration)
- Performance optimizations with memoization

### 2. API Service Layer

**File**: `src/lib/flight-api.ts`

- Dedicated service class for API communication
- Comprehensive error handling with custom error types
- Request timeout and retry logic
- Response validation and type safety

**Key Features**:
- Structured error handling with error codes
- Automatic retry logic for transient errors
- Request timeouts to prevent hanging
- Network status awareness

### 3. TanStack Query Integration

**File**: `src/hooks/use-flight-search-query.ts`

- Smart polling with adaptive intervals
- Automatic error recovery
- Cache management and optimization
- Background refetching capabilities

**Key Features**:
- Server-driven polling intervals
- Exponential backoff for retries
- Smart cache invalidation
- Connection-aware polling

### 4. React Context Provider

**File**: `src/contexts/flight-search-provider.tsx`

- Combines Zustand store with TanStack Query
- Provides unified API for components
- Performance-optimized with selector hooks
- Clean separation of concerns

**Available Hooks**:
- `useFlightSearch()` - Complete flight search state
- `useFlightSearchState()` - Loading and error states
- `useFlightSearchData()` - Flight data only
- `useFlightSearchActions()` - Action methods only
- `useFlightSearchFilters()` - Sorting and filtering

### 5. UI Components

#### Main Container
**File**: `src/components/flight-search/flight-search-container.tsx`

Complete flight search experience with status, controls, and results.

#### Flight List
**File**: `src/components/flight-search/flight-list-new.tsx`

- Virtualized scrolling for performance
- Responsive design for mobile and desktop
- Empty states and loading indicators
- Connection status awareness

#### Flight Card
**File**: `src/components/flight-search/flight-card-new.tsx`

- Mobile-optimized layout
- Detailed flight information
- Error handling for booking attempts
- Accessibility features

#### Search Controls
**File**: `src/components/flight-search/flight-search-controls.tsx`

- Sorting options (default, cheapest, fastest, shortest)
- Advanced filtering with sliders and selectors
- Mobile-friendly dialog interface
- Real-time filter application

#### Status Display
**File**: `src/components/flight-search/flight-search-status.tsx`

- Real-time search progress
- Connection status
- Error reporting
- Performance statistics

## Usage Examples

### Basic Usage

```tsx
import { FlightSearchContainer } from '@/components/flight-search'

export default function FlightSearchPage() {
  return (
    <FlightSearchContainer 
      showStatus={true}
      showDetailedStats={false}
    />
  )
}
```

### Custom Implementation

```tsx
import { 
  FlightSearchProvider,
  FlightList,
  FlightSearchControls,
  useFlightSearchActions 
} from '@/components/flight-search'

function CustomFlightSearch() {
  const { initiateSearch } = useFlightSearchActions()
  
  const handleSearch = (searchId: string) => {
    initiateSearch(searchId)
  }
  
  return (
    <FlightSearchProvider>
      <FlightSearchControls />
      <FlightList showControls={false} />
    </FlightSearchProvider>
  )
}
```

### Campaign Integration

For displaying flights in campaign messages:

```tsx
import { FlightListChat } from '@/components/flight-search'

function ChatMessage({ message }) {
  return (
    <div>
      <p>{message.content}</p>
      {message.flights && (
        <FlightListChat 
          flights={message.flights} 
          searchId={message.searchId} 
        />
      )}
    </div>
  )
}
```

## Performance Optimizations

1. **Virtualization**: Large flight lists use virtual scrolling
2. **Memoization**: Components are memoized to prevent unnecessary re-renders
3. **Selective Updates**: Zustand store updates only changed data
4. **Lazy Loading**: Components load only when needed
5. **Smart Polling**: Adaptive polling intervals based on server response
6. **Cache Management**: Intelligent cache invalidation and persistence

## Mobile Responsiveness

- Mobile-first design approach
- Touch-friendly controls and interactions
- Responsive layouts that adapt to screen size
- Optimized performance for mobile devices
- Offline support with connection status indicators

## Error Handling

1. **API Errors**: Structured error handling with user-friendly messages
2. **Network Issues**: Automatic retries and offline detection
3. **Data Validation**: Client-side validation of API responses
4. **Graceful Degradation**: Fallbacks for missing or invalid data
5. **User Feedback**: Clear error messages and recovery options

## Testing Strategy

- Unit tests for utility functions and API service
- Integration tests for React hooks and context
- Component tests for UI interactions
- E2E tests for complete user flows
- Performance tests for large datasets

## Migration from Old System

The old flight search components have been gradually replaced:

- `flight-list.tsx` → `flight-list-new.tsx`
- `flight-card.tsx` → `flight-card-new.tsx`
- `use-flight-search.ts` → `use-flight-search-query.ts`
- `flight-search-context.tsx` → `flight-search-provider.tsx`

Old components remain for backward compatibility during the transition period.

## Future Enhancements

1. **Advanced Filters**: More sophisticated filtering options
2. **Price Alerts**: Real-time price monitoring
3. **Comparison Tools**: Side-by-side flight comparison
4. **Booking Integration**: Enhanced booking flow
5. **Analytics**: Advanced search analytics and insights

## Troubleshooting

### Common Issues

1. **Crashes during flight loading**: 
   - Check network connectivity
   - Verify API endpoint configuration
   - Review browser console for errors

2. **Slow performance**:
   - Enable virtualization for large lists
   - Check for unnecessary re-renders
   - Optimize filter configurations

3. **Data not updating**:
   - Verify search ID is valid
   - Check polling status
   - Review TanStack Query cache status

For detailed troubleshooting, check the browser console and network tab for error messages and failed requests.