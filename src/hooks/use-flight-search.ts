'use client'

import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookingFlightOption, ProgressiveSearchResponse, SearchStatus } from '@/types/flights';

const initialSearchData: ProgressiveSearchResponse = {
  searchId: '',
  status: {
    searchId: '',
    status: 'completed',
    progress: { gatesQueried: 0, gatesCompleted: 0, percentComplete: 0 },
    totalFlights: 0,
    lastUpdate: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
  },
  newFlights: [],
  pricingTokens: {},
  hasMoreResults: false,
};

async function fetchFlightResults(searchId: string | null): Promise<ProgressiveSearchResponse> {
  if (!searchId) {
    return initialSearchData;
  }
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/search/${searchId}/results`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return { ...initialSearchData, searchId, status: { ...initialSearchData.status, searchId, status: 'expired' } };
    }
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export function useFlightSearch() {
  const [searchId, setSearchId] = useState<string | null>(null);
  const accumulatedFlightsRef = useRef<Map<string, BookingFlightOption>>(new Map());
  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['flights', searchId],
    queryFn: () => fetchFlightResults(searchId),
    enabled: !!searchId,
    
    // Disable all automatic refetches. Polling should only be driven by refetchInterval.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,

    refetchInterval: (query) => {
      const data = query.state.data;

      // If there's no data for some reason, stop.
      if (!data) {
        return false;
      }

      const isSearchComplete = data.status.status === 'completed' || data.status.status === 'expired';
      const hasMoreServerResults = data.hasMoreResults;

      // If the server says it's done, or there are no more results, stop polling.
      if (isSearchComplete || !hasMoreServerResults) {
        return false;
      }
      
      // If the server is still searching, continue polling.
      return data.nextPollAfter ? data.nextPollAfter * 1000 : 6000;
    },
    select: (data) => {
      data.newFlights.forEach(flight => {
        const pricingToken = data.pricingTokens[flight.id];
        accumulatedFlightsRef.current.set(flight.id, { ...flight, pricingToken });
      });
      return {
        ...data,
        newFlights: Array.from(accumulatedFlightsRef.current.values()),
      };
    },
  });

  const startSearch = useCallback((newSearchId: string) => {
    accumulatedFlightsRef.current.clear();
    setSearchId(newSearchId);
  }, []);

  const resetSearch = useCallback(() => {
    accumulatedFlightsRef.current.clear();
    setSearchId(null);
    queryClient.removeQueries({ queryKey: ['flights'] });
  }, [queryClient]);

  const flights = data?.newFlights ?? [];
  const pricingTokens = data?.pricingTokens ?? {};
  
  const isCompleted = data?.status.status === 'completed' || data?.status.status === 'expired';
  // "isSearching" should be true as long as we have a searchId and the search isn't complete.
  const isSearching = !!searchId && !isCompleted;

  return {
    searchId,
    flights,
    pricingTokens,
    isSearching,
    error: error?.message || null,
    startSearch,
    resetSearch,
  };
}