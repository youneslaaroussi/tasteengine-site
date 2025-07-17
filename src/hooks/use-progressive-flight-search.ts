'use client';

import { useState, useRef, useCallback } from 'react';
import { BookingFlightOption, SearchStatus, ProgressiveSearchResponse } from '@/types/flights';

export function useProgressiveFlightSearch() {
    const [isSearching, setIsSearching] = useState(false);
    const [searchId, setSearchId] = useState<string | null>(null);
    const [status, setStatus] = useState<SearchStatus | null>(null);
    const [flights, setFlights] = useState<BookingFlightOption[]>([]);
    const [pricingTokens, setPricingTokens] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [agentMessage, setAgentMessage] = useState('');
    
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const pollingInterval = 6000;

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const startSearch = useCallback((targetSearchId: string, initialMessage: string) => {
        stopPolling();
        setIsSearching(true);
        setSearchId(targetSearchId);
        setStatus(null);
        setFlights([]);
        setPricingTokens({});
        setError(null);
        setAgentMessage(initialMessage);

        const pollForResults = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/search/${targetSearchId}/results`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: ProgressiveSearchResponse = await response.json();
                const { status, newFlights, pricingTokens, hasMoreResults, nextPollAfter } = data;

                setStatus(status);
                setFlights(prev => {
                    const flightMap = new Map<string, BookingFlightOption>();
                    // Add existing flights to the map
                    for (const flight of prev) {
                        flightMap.set(flight.id, flight);
                    }
                    // Add new flights, overwriting duplicates
                    for (const flight of newFlights) {
                        flightMap.set(flight.id, flight);
                    }
                    // Return an array of the unique flights
                    return Array.from(flightMap.values());
                });
                setPricingTokens(prev => ({ ...prev, ...pricingTokens }));
                setAgentMessage(hasMoreResults 
                    ? `Loading flights... ${status.progress.percentComplete}% complete (${status.totalFlights} flights found so far)`
                    : `Search completed! Found ${status.totalFlights} flights.`);

                if (hasMoreResults && status.status === 'searching') {
                    pollingRef.current = setTimeout(pollForResults, nextPollAfter ? nextPollAfter * 1000 : pollingInterval);
                } else {
                    setIsSearching(false);
                }
            } catch (err: any) {
                console.error('Polling error:', err);
                if (err.message.includes('404')) {
                    setError('Search expired or not found');
                } else {
                    setError('An error occurred while fetching flight results.');
                }
                setIsSearching(false);
                stopPolling();
            }
        };

        pollForResults();
    }, [stopPolling]);

    const resetSearch = useCallback(() => {
        stopPolling();
        setIsSearching(false);
        setSearchId(null);
        setStatus(null);
        setFlights([]);
        setPricingTokens({});
        setError(null);
        setAgentMessage('');
    }, [stopPolling]);

    return {
        isSearching,
        searchId,
        status,
        flights,
        pricingTokens,
        error,
        agentMessage,
        startSearch,
        resetSearch
    };
} 