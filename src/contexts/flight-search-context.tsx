'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useProgressiveFlightSearch } from '@/hooks/use-progressive-flight-search';
import { BookingFlightOption } from '@/types/flights';

type FlightSearchContextType = {
    isSearching: boolean;
    searchId: string | null;
    status: any;
    flights: BookingFlightOption[];
    pricingTokens: Record<string, string>;
    error: string | null;
    agentMessage: string;
    startSearch: (targetSearchId: string, initialMessage: string) => void;
    resetSearch: () => void;
};

const FlightSearchContext = createContext<FlightSearchContextType | undefined>(undefined);

export function FlightSearchProvider({ children }: { children: ReactNode }) {
    const flightSearch = useProgressiveFlightSearch();
    return (
        <FlightSearchContext.Provider value={flightSearch}>
            {children}
        </FlightSearchContext.Provider>
    );
}

export function useFlightSearch() {
    const context = useContext(FlightSearchContext);
    if (context === undefined) {
        throw new Error('useFlightSearch must be used within a FlightSearchProvider');
    }
    return context;
} 