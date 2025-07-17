'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BookingFlightOption } from '@/types/flights';

interface SavedFlightDetails {
  pricingToken: string;
  searchId: string;
}

interface SavedFlightsContextType {
  savedFlights: Map<string, SavedFlightDetails>;
  toggleSavedFlight: (flightId: string, details?: SavedFlightDetails) => void;
  isSavedFlightLoading: boolean;
  getSavedFlightData: () => BookingFlightOption[];
  clearSavedFlights: () => void;
}

const SavedFlightsContext = createContext<SavedFlightsContextType | undefined>(undefined);

export function SavedFlightsProvider({ children }: { children: ReactNode }) {
  const [savedFlights, setSavedFlights] = useState<Map<string, SavedFlightDetails>>(new Map());
  const [isSavedFlightLoading, setIsSavedFlightLoading] = useState(false);

  const serializeMap = (map: Map<string, SavedFlightDetails>) => {
    return JSON.stringify(Array.from(map.entries()));
  }

  const deserializeMap = (jsonStr: string): Map<string, SavedFlightDetails> => {
    try {
      return new Map(JSON.parse(jsonStr));
    } catch {
      return new Map();
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedFlights');
      if (saved) {
        setSavedFlights(deserializeMap(saved));
      }
    } catch (error) {
      console.error('Error loading saved flights:', error);
    }
  }, []);

  useEffect(() => {
    // Only write to localStorage if it's not the initial empty map, or if it has been cleared
    if (savedFlights.size > 0 || localStorage.getItem('savedFlights')) {
        try {
            localStorage.setItem('savedFlights', serializeMap(savedFlights));
        } catch (error) {
            console.error('Error saving flights:', error);
        }
    }
  }, [savedFlights]);

  const toggleSavedFlight = useCallback((flightId: string, details?: SavedFlightDetails) => {
    setIsSavedFlightLoading(true);
    
    setSavedFlights(prev => {
      const newMap = new Map(prev);
      if (details) { // Add or update flight
        newMap.set(flightId, details);
      } else { // Remove flight
        newMap.delete(flightId);
      }
      return newMap;
    });
    
    setTimeout(() => setIsSavedFlightLoading(false), 300);
  }, []);

  const getSavedFlightData = useCallback((): BookingFlightOption[] => {
    try {
      const allFlightData = localStorage.getItem('allFlightData');
      if (allFlightData && savedFlights.size > 0) {
        const parsedData: BookingFlightOption[] = JSON.parse(allFlightData);
        return Array.from(savedFlights.keys()).map(id => {
          return parsedData.find((flight) => flight.id === id);
        }).filter((flight): flight is BookingFlightOption => Boolean(flight));
      }
      return [];
    } catch (error) {
      console.error('Error loading saved flight data:', error);
      return [];
    }
  }, [savedFlights]);

  const clearSavedFlights = () => {
    setSavedFlights(new Map());
    localStorage.removeItem('savedFlights');
  };

  return (
    <SavedFlightsContext.Provider
      value={{
        savedFlights,
        toggleSavedFlight,
        isSavedFlightLoading,
        getSavedFlightData,
        clearSavedFlights
      }}
    >
      {children}
    </SavedFlightsContext.Provider>
  );
}

export function useSavedFlights() {
  const context = useContext(SavedFlightsContext);
  if (context === undefined) {
    throw new Error('useSavedFlights must be used within a SavedFlightsProvider');
  }
  return context;
} 