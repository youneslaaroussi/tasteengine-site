export interface FlightSegment {
  segmentNumber: number
  origin: string
  destination: string
  departureDate: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  travelClass: string
}

export interface BookingFlightOption {
  id: string
  journeyType: 'one-way' | 'round-trip' | 'multi-city'
  totalDuration: string
  totalStops: number
  price: number
  currency: string
  availableSeats: number
  baggageAllowance: string
  cancellationPolicy: string
  changePolicy: string
  
  partnerInfo?: {
    name?: string
    company?: string
    [key: string]: any
  }
  
  segments: FlightSegment[]
  
  // Legacy fields for backward compatibility
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  travelClass: string
}

export interface SearchStatus {
  searchId: string
  status: 'searching' | 'completed' | 'failed' | 'expired'
  progress: {
    gatesQueried: number
    gatesCompleted: number
    percentComplete: number
  }
  totalFlights: number
  lastUpdate: string
  expiresAt: string
}

export interface ProgressiveSearchResponse {
  searchId: string
  status: SearchStatus
  newFlights: BookingFlightOption[]
  pricingTokens: Record<string, string>
  hasMoreResults: boolean
  nextPollAfter?: number
}