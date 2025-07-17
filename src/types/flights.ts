export interface PassengerInfo {
  type: 'adult' | 'child' | 'infant';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface PaymentInfo {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface FlightBookingDetails {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  travelClass: string;
}

export interface BookingSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  travelClass?: string;
}

// Legacy response for backward compatibility
export interface BookingSearchResponse {
  searchId: string;
  flights: BookingFlightOption[];
  pricingTokens: Record<string, string>;
}

// New progressive search interfaces
export interface SearchInitiationResponse {
  searchId: string;
  status: 'initiated' | 'error';
  message: string;
  estimatedDuration?: number; // in seconds
}

export interface SearchStatus {
  searchId: string;
  status: 'searching' | 'completed' | 'failed' | 'expired';
  progress: {
    gatesQueried: number;
    gatesCompleted: number;
    percentComplete: number;
  };
  totalFlights: number;
  lastUpdate: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
}

export interface ProgressiveSearchResponse {
  searchId: string;
  status: SearchStatus;
  newFlights: BookingFlightOption[];
  pricingTokens: Record<string, string>;
  hasMoreResults: boolean;
  nextPollAfter?: number; // seconds to wait before next poll
}

// Flight segment for multi-city journeys
export interface FlightSegment {
  segmentNumber: number;
  origin: string;
  destination: string;
  departureDate: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  travelClass: string;
}

export interface BookingFlightOption {
  id: string;
  // Overall journey details
  journeyType: 'one-way' | 'round-trip' | 'multi-city';
  totalDuration: string;
  totalStops: number;
  price: number;
  currency: string;
  availableSeats: number;
  baggageAllowance: string;
  cancellationPolicy: string;
  changePolicy: string;
  
  // All segments of the journey
  segments: FlightSegment[];
  
  // Legacy fields for backward compatibility (derived from first segment)
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  travelClass: string;
}

export interface BookingValidationRequest {
  flightId: string;
  pricingToken: string;
  passengers: PassengerInfo[];
}

export interface BookingValidationResponse {
  isValid: boolean;
  price: number;
  currency: string;
  availableSeats: number;
  warnings: string[];
  errors: string[];
}

// Sorting types from previous implementation (for UI)
export type SortOption = 'price' | 'duration' | 'departure' | 'airline';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    option: SortOption;
    direction: SortDirection;
} 