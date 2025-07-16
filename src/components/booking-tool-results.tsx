import { memo, useState, useRef, useEffect } from 'react';
import {
    Plane,
    Clock,
    MapPin,
    Calendar,
    CreditCard,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ExternalLink,
    User,
    Mail,
    Phone,
    Home,
    Loader2,
    ArrowUpDown,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToolProgress, StatusMessage } from '@/components/tool-status';


interface SearchStatus {
    searchId: string;
    status: 'searching' | 'completed' | 'failed' | 'expired';
    progress: {
        gatesQueried: number;
        gatesCompleted: number;
        percentComplete: number;
    };
    totalFlights: number;
    lastUpdate: string;
    expiresAt: string;
}

interface FlightOption {
    id: string;
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
    price: number;
    currency: string;
    availableSeats: number;
    baggageAllowance: string;
    cancellationPolicy: string;
    changePolicy: string;
    bookingUrl: string;
}

interface ProgressiveSearchResponse {
    searchId: string;
    status: SearchStatus;
    newFlights: FlightOption[];
    pricingTokens: Record<string, string>;
    hasMoreResults: boolean;
    nextPollAfter?: number;
}

interface AgentResponse {
    success: boolean;
    searchId?: string;
    message: string;
    searchDetails?: {
        route: string;
        departureDate: string;
        returnDate?: string;
        passengers: number;
        travelClass: string;
        estimatedDuration: number;
        pollingInstructions: {
            resultsEndpoint: string;
            statusEndpoint: string;
            recommendedPollInterval: string;
            note: string;
        };
    };
}

// Add sorting types
type SortOption = 'price' | 'duration' | 'departure' | 'airline';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    option: SortOption;
    direction: SortDirection;
}

// Main Progressive Flight Search Component
interface ProgressiveFlightSearchProps {
    searchParams: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        passengers: number;
        travelClass: string;
    };
    searchData?: any;
    onSearchComplete?: (flights: FlightOption[]) => void;
    autoInitiate?: boolean;
}

export const ProgressiveFlightSearch = memo(function ProgressiveFlightSearch({
    searchParams,
    searchData,
    onSearchComplete,
    autoInitiate = true
}: ProgressiveFlightSearchProps) {
    // Progressive search state
    const [searchState, setSearchState] = useState<{
        isSearching: boolean;
        searchId: string | null;
        status: SearchStatus | null;
        flights: FlightOption[];
        pricingTokens: Record<string, string>;
        error: string | null;
        agentMessage: string;
    }>(() => {
        // Initialize state immediately if we have searchId
        if (searchData && autoInitiate) {
            return {
                isSearching: true,
                searchId: searchData.searchId,
                status: null,
                flights: [],
                pricingTokens: {},
                error: null,
                agentMessage: `Starting flight search for ${searchParams.origin} to ${searchParams.destination}...`
            };
        }
        return {
            isSearching: false,
            searchId: null,
            status: null,
            flights: [],
            pricingTokens: {},
            error: null,
            agentMessage: ''
        };
    });

    // Sorting state
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        option: 'price',
        direction: 'asc'
    });
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Polling control
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const [pollingInterval] = useState(6000); // 6 seconds default
    const [loadingFlightId, setLoadingFlightId] = useState<string | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setShowSortDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sorting functions
    const sortFlights = (flights: FlightOption[], config: SortConfig): FlightOption[] => {
        return [...flights].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (config.option) {
                case 'price':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'duration':
                    // Convert duration string to minutes for comparison
                    aValue = parseDuration(a.duration);
                    bValue = parseDuration(b.duration);
                    break;
                case 'departure':
                    aValue = new Date(`${a.departureDate} ${a.departureTime}`).getTime();
                    bValue = new Date(`${b.departureDate} ${b.departureTime}`).getTime();
                    break;
                case 'airline':
                    aValue = a.airline.toLowerCase();
                    bValue = b.airline.toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (config.direction === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    };

    const parseDuration = (duration: string): number => {
        // Parse duration string like "2h 30m" or "1h 15m" to minutes
        const match = duration.match(/(\d+)h\s*(\d+)?m?/);
        if (match) {
            const hours = parseInt(match[1]) || 0;
            const minutes = parseInt(match[2]) || 0;
            return hours * 60 + minutes;
        }
        return 0;
    };

    const handleSortChange = (option: SortOption) => {
        setSortConfig(prev => ({
            option,
            direction: prev.option === option && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setShowSortDropdown(false);
    };

    // Get sorted flights
    const sortedFlights = sortFlights(searchState.flights, sortConfig);

    // STEP 1: Progressive Polling for Results
    const startProgressivePolling = (targetSearchId: string) => {
        // Stop any existing polling first
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
        }

        const pollForResults = async () => {
            try {
                // Poll the progressive results endpoint
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/search/${targetSearchId}/results`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: ProgressiveSearchResponse = await response.json();
                const { status, newFlights, pricingTokens, hasMoreResults, nextPollAfter } = data;

                setSearchState(prev => ({
                    ...prev,
                    status,
                    flights: [...prev.flights, ...newFlights],
                    pricingTokens: { ...prev.pricingTokens, ...pricingTokens },
                    agentMessage: hasMoreResults 
                        ? `Loading flights... ${status.progress.percentComplete}% complete (${status.totalFlights} flights found so far)`
                        : `Search completed! Found ${status.totalFlights} flights.`
                }));

                // Continue polling if there are more results
                if (hasMoreResults && status.status === 'searching') {
                    pollingRef.current = setTimeout(pollForResults, nextPollAfter ? nextPollAfter * 1000 : pollingInterval);
                } else {
                    // Search completed - send results back to agent
                    const allFlights = searchState.flights.concat(newFlights);
                    const allPricingTokens = { ...searchState.pricingTokens, ...pricingTokens };
                    
                    setSearchState(prev => ({ ...prev, isSearching: false }));
                    
                    // Send completed flight data back to agent to append to message
                    sendFlightResultsToAgent(targetSearchId, allFlights, allPricingTokens);
                    
                    if (onSearchComplete) {
                        onSearchComplete(allFlights);
                    }
                }
            } catch (error: any) {
                console.error('Polling error:', error);
                
                // If search not found or expired, stop polling
                if (error.message.includes('404')) {
                    setSearchState(prev => ({
                        ...prev,
                        isSearching: false,
                        error: 'Search expired or not found'
                    }));
                } else {
                    // Retry polling for other errors
                    pollingRef.current = setTimeout(pollForResults, pollingInterval);
                }
            }
        };

        // Start immediate polling
        pollForResults();
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
        }
    };

    // Send completed flight results back to agent to append to message
    const sendFlightResultsToAgent = async (searchId: string, flights: FlightOption[], pricingTokens: Record<string, string>) => {
        try {
            const flightResultData = {
                searchId,
                flights,
                pricingTokens,
                hasMoreResults: false,
                status: {
                    searchId,
                    status: 'completed',
                    progress: {
                        gatesQueried: searchState.status?.progress.gatesQueried || 0,
                        gatesCompleted: searchState.status?.progress.gatesCompleted || 0,
                        percentComplete: 100
                    },
                    totalFlights: flights.length,
                    lastUpdate: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
                }
            };

            // Send to backend to trigger tool completion and append to message
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agent/complete-flight-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchId,
                    toolName: 'search_bookable_flights',
                    data: flightResultData,
                    message: `Found ${flights.length} flights for ${searchParams.origin} to ${searchParams.destination}`
                }),
            });
        } catch (error) {
            console.error('Failed to send flight results to agent:', error);
        }
    };



    // Set up cleanup function
    cleanupRef.current = stopPolling;

    // STEP 2: Start polling immediately if we have searchId
    if (searchData && autoInitiate && searchState.searchId === searchData.searchId && searchState.isSearching && !pollingRef.current) {
        startProgressivePolling(searchData.searchId);
    }

    // STEP 3: Generate Booking URL (when user clicks book)
    const handleBookFlight = async (flight: FlightOption) => {
        if (loadingFlightId || !searchState.searchId) return;

        setLoadingFlightId(flight.id);

        try {
            // Get the pricing token for this flight
            const pricingToken = searchState.pricingTokens[flight.id];
            if (!pricingToken) {
                console.error('Pricing token not found for flight:', flight.id);
                throw new Error('Pricing token not found for this flight');
            }
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/generate-booking-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchId: searchState.searchId,
                    termsUrl: pricingToken
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Open the booking URL in a new tab
            if (result.bookingUrl) {
                window.open(result.bookingUrl, '_blank');
            } else {
                // Fallback to original booking URL if available
                window.open(flight.bookingUrl, '_blank');
            }

        } catch (error) {
            console.error('Failed to generate booking URL:', error);
            // Fallback to original booking URL
            window.open(flight.bookingUrl, '_blank');
        } finally {
            setLoadingFlightId(null);
        }
    };

    const handleManualSearch = () => {
        setSearchState(prev => ({
            ...prev,
            isSearching: false,
            error: 'Search should be initiated by the agent tool. Please ask the agent to search for flights.'
        }));
    };

    return (
        <div className="space-y-4">
            {/* Agent Message & Search Status */}
            {searchState.agentMessage && (
                <StatusMessage content={searchState.agentMessage} />
            )}

            {/* Progress Display */}
            {searchState.isSearching && searchState.status && (
                <ToolProgress
                    toolName="flight_search"
                    description={`Searching ${searchParams.origin} to ${searchParams.destination}`}
                    progress={searchState.status.progress.percentComplete}
                    progressText={`${searchState.status.progress.gatesCompleted}/${searchState.status.progress.gatesQueried} booking sites checked`}
                    isComplete={false}
                />
            )}

            {/* Error Display */}
            {searchState.error && (
                <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-800">{searchState.error}</span>
                    </div>
                </Card>
            )}

            {/* Progressive Flight Results */}
            {searchState.flights.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Flight Results ({searchState.flights.length} flights)
                        </h3>
                        
                        <div className="flex items-center gap-3">
                            {searchState.isSearching && (
                                <div className="flex items-center text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Loading more flights...
                                </div>
                            )}
                            
                            {/* Sort Dropdown */}
                            <div className="relative" ref={sortDropdownRef}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className="flex items-center gap-2 min-w-[120px]"
                                >
                                    <ArrowUpDown className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sort by</span>
                                    <span className="capitalize">
                                        {sortConfig.option === 'departure' ? 'Time' : sortConfig.option}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                                
                                {showSortDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                        <div className="py-1">
                                            {[
                                                { value: 'price', label: 'Price', icon: '💰' },
                                                { value: 'duration', label: 'Duration', icon: '⏱️' },
                                                { value: 'departure', label: 'Departure Time', icon: '🕐' },
                                                { value: 'airline', label: 'Airline', icon: '✈️' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleSortChange(option.value as SortOption)}
                                                    className={cn(
                                                        "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2",
                                                        sortConfig.option === option.value && "bg-blue-50 text-blue-600"
                                                    )}
                                                >
                                                    <span>{option.icon}</span>
                                                    <span>{option.label}</span>
                                                    {sortConfig.option === option.value && (
                                                        <span className="ml-auto text-xs">
                                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sortedFlights.map((flight, index) => {
                            const isLoading = loadingFlightId === flight.id;
                            const isNewFlight = index >= searchState.flights.length - 3;

                            return (
                                <Card 
                                    key={flight.id} 
                                    className={cn(
                                        "p-3 sm:p-4 hover:shadow-md transition-all duration-500",
                                        isNewFlight && "animate-fade-in bg-green-50 border-green-200"
                                    )}
                                >
                                    <div className="flex flex-col gap-4">
                                        {/* Mobile-first layout: Price at top on mobile */}
                                        <div className="flex items-center justify-between sm:hidden">
                                            <div className="text-xl font-bold text-gray-900">
                                                {flight.currency} {flight.price}
                                            </div>
                                            <div className="text-xs text-gray-500">per person</div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                {/* Flight Route and Times */}
                                                <div className="flex items-center gap-2 sm:gap-4">
                                                    <div className="text-center min-w-0 flex-shrink-0">
                                                        <div className="text-base sm:text-lg font-bold text-gray-900">{flight.origin}</div>
                                                        <div className="text-xs sm:text-sm font-medium text-blue-600">{flight.departureTime}</div>
                                                    </div>

                                                    <div className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
                                                        <div className="flex-1 h-px bg-gray-300 relative">
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="bg-white px-1 sm:px-2 text-xs text-gray-500 whitespace-nowrap">
                                                                    {flight.duration}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {flight.stops > 0 && (
                                                            <div className="text-xs text-orange-600 font-medium whitespace-nowrap">
                                                                {flight.stops} stop{flight.stops > 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                        {flight.stops === 0 && (
                                                            <div className="text-xs text-green-600 font-medium whitespace-nowrap">
                                                                Direct
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-center min-w-0 flex-shrink-0">
                                                        <div className="text-base sm:text-lg font-bold text-gray-900">{flight.destination}</div>
                                                        <div className="text-xs sm:text-sm font-medium text-blue-600">{flight.arrivalTime}</div>
                                                    </div>
                                                </div>

                                                {/* Flight Details - Responsive grid */}
                                                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Plane className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span className="truncate">{flight.airline} {flight.flightNumber}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span className="truncate">{new Date(flight.departureDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span className="truncate">{flight.travelClass}</span>
                                                    </div>
                                                    <div className="text-green-600 font-medium">
                                                        {flight.availableSeats} seats left
                                                    </div>
                                                </div>

                                                {/* Policies - Collapsible on mobile */}
                                                <div className="text-xs text-gray-500 space-y-1 sm:block hidden">
                                                    <div>• {flight.baggageAllowance}</div>
                                                    <div>• {flight.cancellationPolicy}</div>
                                                    <div>• {flight.changePolicy}</div>
                                                </div>
                                            </div>

                                            {/* Price and Booking - Desktop layout */}
                                            <div className="hidden sm:flex sm:flex-col sm:w-auto sm:ml-6 text-center sm:text-right space-y-3">
                                                <div>
                                                    <div className="text-2xl font-bold text-gray-900">
                                                        {flight.currency} {flight.price}
                                                    </div>
                                                    <div className="text-sm text-gray-500">per person</div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Button
                                                        onClick={() => handleBookFlight(flight)}
                                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Generating Link...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CreditCard className="w-4 h-4 mr-2" />
                                                                Book Now
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile booking button */}
                                        <div className="sm:hidden">
                                            <Button
                                                onClick={() => handleBookFlight(flight)}
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Generating Link...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="w-4 h-4 mr-2" />
                                                        Book Now
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Mobile policies - expandable */}
                                        <details className="sm:hidden">
                                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                                View policies & details
                                            </summary>
                                            <div className="text-xs text-gray-500 space-y-1 mt-2 pl-4">
                                                <div>• {flight.baggageAllowance}</div>
                                                <div>• {flight.cancellationPolicy}</div>
                                                <div>• {flight.changePolicy}</div>
                                            </div>
                                        </details>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Manual Search Trigger (if auto-initiate is disabled) */}
            {!autoInitiate && !searchState.isSearching && searchState.flights.length === 0 && (
                <Card className="p-4">
                    <Button
                        onClick={handleManualSearch}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        <Plane className="w-4 h-4 mr-2" />
                        Search Flights
                    </Button>
                </Card>
            )}
        </div>
    );
});

// Backward compatibility: Keep legacy component names but use new implementation
export const FlightSearchResults = ProgressiveFlightSearch;

// Legacy Booking Validation Component (kept for compatibility)
interface BookingValidationProps {
    data: {
        isValid: boolean;
        price: number;
        currency: string;
        availableSeats: number;
        warnings: string[];
        errors: string[];
    };
    flightInfo?: { airline: string; flightNumber: string; };
}

export const BookingValidation = memo(function BookingValidation({
    data,
    flightInfo
}: BookingValidationProps) {
    return (
        <Card className={cn(
            "p-4",
            data.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        )}>
            <div className="flex items-start gap-3">
                {data.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                        Booking Validation {data.isValid ? 'Successful' : 'Failed'}
                    </h4>

                    {flightInfo && (
                        <p className="text-sm text-gray-600 mb-3">
                            {flightInfo.airline} {flightInfo.flightNumber}
                        </p>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Current Price:</span>
                            <span className="font-medium">{data.currency} {data.price}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Available Seats:</span>
                            <span className="font-medium">{data.availableSeats}</span>
                        </div>
                    </div>

                    {data.warnings.length > 0 && (
                        <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-1 text-orange-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">Warnings:</span>
                            </div>
                            {data.warnings.map((warning, index) => (
                                <p key={index} className="text-sm text-orange-700 ml-5">• {warning}</p>
                            ))}
                        </div>
                    )}

                    {data.errors.length > 0 && (
                        <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Errors:</span>
                            </div>
                            {data.errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-700 ml-5">• {error}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
});

// Booking Confirmation Component (kept unchanged for legacy support)
interface BookingConfirmationProps {
    data: {
        bookingId: string;
        status: string;
        confirmationCode: string;
        totalPrice: number;
        currency: string;
        flightDetails: any;
        passengerDetails: any[];
        contactInfo: any;
        bookingDate: string;
        terms: string[];
        cancellationPolicy: string;
        changePolicy: string;
    };
}

export const BookingConfirmation = memo(function BookingConfirmation({ data }: BookingConfirmationProps) {
    return (
        <div className="space-y-4">
            <Card className="p-6 border-green-200 bg-green-50">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                        <h3 className="text-lg font-semibold text-green-900">Booking Confirmed!</h3>
                        <p className="text-sm text-green-700">Confirmation Code: {data.confirmationCode}</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-bold text-green-900">
                        {data.currency} {data.totalPrice}
                    </div>
                    <div className="text-sm text-green-700">Total Amount</div>
                </div>
            </Card>
        </div>
    );
});

// Booking Cancellation Component (kept for legacy support)
interface BookingCancellationProps {
    data: {
        success: boolean;
        message: string;
    };
}

export const BookingCancellation = memo(function BookingCancellation({ data }: BookingCancellationProps) {
    return (
        <Card className={cn(
            "p-4",
            data.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        )}>
            <div className="flex items-start gap-3">
                {data.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}

                <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                        Booking Cancellation {data.success ? 'Successful' : 'Failed'}
                    </h4>
                    <p className="text-sm text-gray-700">{data.message}</p>
                </div>
            </div>
        </Card>
    );
});

// Affiliate Links Component (kept for legacy support)
interface AffiliateLinksProps {
    data: {
        success: boolean;
        links: Array<{
            original_url: string;
            affiliate_url: string;
        }>;
    };
}

export const AffiliateLinks = memo(function AffiliateLinks({ data }: AffiliateLinksProps) {
    if (!data.success || data.links.length === 0) {
        return (
            <Card className="p-4 border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">No affiliate links generated</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Alternative Booking Links
            </h4>

            <div className="space-y-3">
                {data.links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                            Option {index + 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(link.affiliate_url, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Book Externally
                        </Button>
                    </div>
                ))}
            </div>
        </Card>
    );
}); 