import { FlightItineraryCard } from './flight-itinerary-card';
import { ProgressiveFlightSearch } from './booking-tool-results';

// Centralized tool result data extraction and attachment
export interface ToolResultExtraction {
  resultData: any;
  remainingText: string;
}

// Helper to extract JSON from text
function extractJsonWithRemainingText(str: string): { json: string | null; remaining: string } {
  const startIndex = str.indexOf('{');
  if (startIndex === -1) return { json: null, remaining: str };

  let braceCount = 0;
  let inString = false;
  let endIndex = -1;

  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && (i === 0 || str[i - 1] !== '\\')) {
      inString = !inString;
    }
    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
    }
    if (braceCount === 0 && !inString && startIndex < i) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) return { json: null, remaining: str };

  const jsonCandidate = str.substring(startIndex, endIndex + 1);
  try {
    JSON.parse(jsonCandidate);
    return { json: jsonCandidate, remaining: str.substring(endIndex + 1) };
  } catch (e) {
    return { json: null, remaining: str };
  }
}

// Normalize itinerary data structure
const normalizeItineraryData = (data: any) => {
  const normalized = {
    id: data.id || `itinerary_${Date.now()}`,
    createdAt: data.createdAt || new Date().toISOString(),
    travelerName: data.travelerName || 'Unknown Traveler',
    tripName: data.tripName || 'Flight Itinerary',
    notes: data.notes || '',
    summary: {
      totalFlights: 0,
      totalPrice: 0,
      currency: 'USD',
      destinations: '',
      origins: '',
      ...data.summary
    },
    flights: data.flights || [],
    metadata: {
      generatedBy: 'Travel Assistant',
      version: '1.0',
      format: 'json',
      ...data.metadata
    }
  };

  if (normalized.flights.length > 0) {
    normalized.summary.totalFlights = normalized.flights.length;

    if (normalized.summary.totalPrice === 0) {
      normalized.summary.totalPrice = normalized.flights.reduce((sum: number, flight: any) => {
        return sum + (flight.price?.amount || 0);
      }, 0);
    }

    if (normalized.summary.currency === 'USD' && normalized.flights[0]?.price?.currency) {
      normalized.summary.currency = normalized.flights[0].price.currency;
    }

    if (!normalized.summary.destinations) {
      const destinations = new Set(normalized.flights.map((f: any) => f.destination?.code || f.destination?.city).filter(Boolean));
      normalized.summary.destinations = Array.from(destinations).join(', ');
    }

    if (!normalized.summary.origins) {
      const origins = new Set(normalized.flights.map((f: any) => f.origin?.code || f.origin?.city).filter(Boolean));
      normalized.summary.origins = Array.from(origins).join(', ');
    }
  }

  return normalized;
};

// Tool result extractors - each tool type gets its own extractor
const toolResultExtractors = {
  'create_flight_itinerary': (text: string): ToolResultExtraction | null => {
    try {
      const { json: jsonText, remaining: remainingText } = extractJsonWithRemainingText(text);
      if (!jsonText) return null;

      const fullData = JSON.parse(jsonText);
      let itineraryPayload = null;

      // Check wrapper structure (call_id: { success: true, itinerary: {...} })
      const callIds = Object.keys(fullData).filter(key => key.startsWith('call_') || key.startsWith('toolu_'));
      if (callIds.length > 0) {
        const callData = fullData[callIds[0]];
        if (callData && callData.success) {
          // Check for direct itinerary
          if (callData.itinerary) {
            itineraryPayload = {
              itinerary: normalizeItineraryData(callData.itinerary),
              json: callData.json
            };
          }
          // Check for itinerary under result
          else if (callData.result && callData.result.itinerary) {
            itineraryPayload = {
              itinerary: normalizeItineraryData(callData.result.itinerary),
              json: callData.result.json || callData.json
            };
          }
        }
      }
      // Direct itinerary object
      else if (fullData.id && fullData.id.startsWith('itinerary_')) {
        itineraryPayload = {
          itinerary: normalizeItineraryData(fullData),
          json: undefined
        };
      }
      // Other itinerary structures
      else if (fullData.itinerary) {
        itineraryPayload = {
          itinerary: normalizeItineraryData(fullData.itinerary),
          json: fullData.json
        };
      }
      else if (fullData.flights || fullData.travelerName || fullData.tripName) {
        itineraryPayload = {
          itinerary: normalizeItineraryData(fullData),
          json: undefined
        };
      }

      if (itineraryPayload) {
        return { resultData: itineraryPayload, remainingText };
      }
    } catch (e) {
      console.error('Error parsing itinerary data:', e);
    }
    return null;
  },

  'search_bookable_flights': (text: string): ToolResultExtraction | null => {
    try {
      const { json: jsonText, remaining: remainingText } = extractJsonWithRemainingText(text);
      if (!jsonText) return null;

      const fullData = JSON.parse(jsonText);
      let searchPayload = null;

      // Check wrapper structure
      const callIds = Object.keys(fullData).filter(key => key.startsWith('call_') || key.startsWith('toolu_'));
      if (callIds.length > 0) {
        const callData = fullData[callIds[0]];
        if (callData && callData.success && callData.result) {
          searchPayload = callData.result;
        }
      }
      // Direct search result with search parameters instead of flights
      else if (fullData.searchId || fullData.searchParams || fullData.origin) {
        searchPayload = fullData;
      }

      if (searchPayload) {
        return { resultData: searchPayload, remainingText };
      }
    } catch (e) {
      console.error('Error parsing search data:', e);
    }
    return null;
  },

  'initiate_flight_search': (text: string): ToolResultExtraction | null => {
    try {
      const { json: jsonText, remaining: remainingText } = extractJsonWithRemainingText(text);
      if (!jsonText) return null;

      const fullData = JSON.parse(jsonText);
      let searchInitiationPayload = null;

      // Check wrapper structure
      const callIds = Object.keys(fullData).filter(key => key.startsWith('call_') || key.startsWith('toolu_'));
      if (callIds.length > 0) {
        const callData = fullData[callIds[0]];
        if (callData && callData.success) {
          if (callData.searchId || callData.searchParams) {
            searchInitiationPayload = callData;
          } else if (callData.result) {
            searchInitiationPayload = callData.result;
          }
        }
      }
      // Direct search initiation result
      else if (fullData.searchId || fullData.searchParams || fullData.origin) {
        searchInitiationPayload = fullData;
      }

      if (searchInitiationPayload) {
        return { resultData: searchInitiationPayload, remainingText };
      }
    } catch (e) {
      console.error('Error parsing search initiation data:', e);
    }
    return null;
  }
};

// Centralized tool result extraction
export function extractToolResult(toolName: string, text: string): ToolResultExtraction | null {
  const extractor = toolResultExtractors[toolName as keyof typeof toolResultExtractors];
  return extractor ? extractor(text) : null;
}

// Tool result renderers - each tool type gets its own renderer
export function renderToolResult(toolName: string, resultData: any): React.ReactNode | null {
  switch (toolName) {
    case 'create_flight_itinerary':
      if (resultData?.itinerary) {
        return (
          <div className="mb-4">
            <FlightItineraryCard itinerary={resultData.itinerary} />
          </div>
        );
      }
      break;

    case 'search_bookable_flights':
    case 'initiate_flight_search':
      // Extract search parameters from result data
      const searchParams = extractSearchParams(resultData);
      if (searchParams) {
        return (
          <div className="mb-4">
            <ProgressiveFlightSearch 
              searchParams={searchParams}
              searchData={resultData}
              autoInitiate={true}
            />
          </div>
        );
      }
      break;

    default:
      return null;
  }

  return null;
}

// Helper function to extract search parameters from various data structures
function extractSearchParams(data: any): {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  travelClass: string;
} | null {
  try {
    // Direct search params object
    if (data.searchParams) {
      return {
        origin: data.searchParams.origin || data.searchParams.from,
        destination: data.searchParams.destination || data.searchParams.to,
        departureDate: data.searchParams.departureDate || data.searchParams.departure_date,
        returnDate: data.searchParams.returnDate || data.searchParams.return_date,
        passengers: data.searchParams.passengers || data.searchParams.passenger_count || 1,
        travelClass: data.searchParams.travelClass || data.searchParams.travel_class || 'economy'
      };
    }

    // Direct properties in data
    if (data.origin && data.destination && data.departureDate) {
      return {
        origin: data.origin,
        destination: data.destination,
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        passengers: data.passengers || data.passenger_count || 1,
        travelClass: data.travelClass || data.travel_class || 'economy'
      };
    }

    // Search details object
    if (data.searchDetails) {
      const details = data.searchDetails;
      return {
        origin: details.origin || details.from,
        destination: details.destination || details.to,
        departureDate: details.departureDate || details.departure_date,
        returnDate: details.returnDate || details.return_date,
        passengers: details.passengers || details.passenger_count || 1,
        travelClass: details.travelClass || details.travel_class || 'economy'
      };
    }

    // Parse from message or description
    if (data.message && typeof data.message === 'string') {
      const params = parseSearchFromMessage(data.message);
      if (params) return params;
    }

    return null;
  } catch (e) {
    console.error('Error extracting search parameters:', e);
    return null;
  }
}

// Helper to parse search parameters from natural language message
function parseSearchFromMessage(message: string): {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  travelClass: string;
} | null {
  try {
    // Extract flight route (FROM to TO)
    const routeMatch = message.match(/from\s+([A-Z]{3}|[A-Za-z\s]+)\s+to\s+([A-Z]{3}|[A-Za-z\s]+)/i);
    if (!routeMatch) return null;

    const origin = routeMatch[1].trim();
    const destination = routeMatch[2].trim();

    // Extract departure date
    const departureDateMatch = message.match(/departing\s+(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})/i);
    if (!departureDateMatch) return null;

    const departureDate = departureDateMatch[1];

    // Extract return date (optional)
    const returnDateMatch = message.match(/returning\s+(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})/i);
    const returnDate = returnDateMatch ? returnDateMatch[1] : undefined;

    // Extract passengers
    const passengersMatch = message.match(/(\d+)\s+passenger/i);
    const passengers = passengersMatch ? parseInt(passengersMatch[1]) : 1;

    // Extract travel class
    const classMatch = message.match(/(economy|business|first)\s+class/i);
    const travelClass = classMatch ? classMatch[1].toLowerCase() : 'economy';

    return {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      travelClass
    };
  } catch (e) {
    console.error('Error parsing search from message:', e);
    return null;
  }
}

// List of tools that should use the centralized result handling
export const SPECIAL_RESULT_TOOLS = [
  'create_flight_itinerary',
  'search_bookable_flights',
  'searchBookableFlights',
  'initiate_flight_search'
]; 