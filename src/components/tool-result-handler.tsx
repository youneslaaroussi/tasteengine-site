import { FlightItineraryCard } from './flight-itinerary-card';
import { FlightSearchResults } from './booking-tool-results';

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
      let bookingPayload = null;

      // Check wrapper structure
      const callIds = Object.keys(fullData).filter(key => key.startsWith('call_') || key.startsWith('toolu_'));
      if (callIds.length > 0) {
        const callData = fullData[callIds[0]];
        if (callData && callData.success && callData.result) {
          bookingPayload = callData.result;
        }
      }
      // Direct booking result
      else if (fullData.searchId || fullData.flights) {
        bookingPayload = fullData;
      }

      if (bookingPayload) {
        return { resultData: bookingPayload, remainingText };
      }
    } catch (e) {
      console.error('Error parsing booking data:', e);
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
      if (resultData?.flights) {
        return (
          <FlightSearchResults data={resultData} />
        );
      }
      break;

    default:
      return null;
  }

  return null;
}

// List of tools that should use the centralized result handling
export const SPECIAL_RESULT_TOOLS = [
  'create_flight_itinerary',
  'search_bookable_flights',
  'searchBookableFlights'
]; 