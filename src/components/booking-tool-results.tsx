import { memo, useState, useRef, useEffect } from 'react';
import {
    Plane,
    Calendar,
    CreditCard,
    XCircle,
    User,
    Loader2,
    ArrowUpDown,
    ChevronDown,
    CheckCircle2,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToolProgress, StatusMessage } from '@/components/tool-status';
import {
    BookingFlightOption,
    SortConfig,
    SortOption
} from '@/types/flights';
import { useFlightSearch } from '@/contexts/flight-search-context';

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
}

export const ProgressiveFlightSearch = memo(function ProgressiveFlightSearch({
    searchParams,
    searchData
}: ProgressiveFlightSearchProps) {
    const {
        isSearching,
        status,
        flights,
        pricingTokens,
        error,
        agentMessage,
        startSearch
    } = useFlightSearch();

    // Start search when component is displayed with new search data
    useEffect(() => {
        if (searchData?.searchId) {
            startSearch(searchData.searchId, `Starting flight search...`);
        }
    }, [searchData?.searchId, startSearch, searchParams.origin, searchParams.destination]);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        option: 'price',
        direction: 'asc'
    });
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    const [loadingFlightId, setLoadingFlightId] = useState<string | null>(null);

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
    const sortFlights = (flights: BookingFlightOption[], config: SortConfig): BookingFlightOption[] => {
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
                    aValue = parseDuration(a.totalDuration);
                    bValue = parseDuration(b.totalDuration);
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
    const sortedFlights = sortFlights(flights, sortConfig);

    // STEP 3: Generate Booking URL (when user clicks book)
    const handleBookFlight = async (flight: BookingFlightOption) => {
        if (loadingFlightId || !searchData?.searchId) return;

        setLoadingFlightId(flight.id);

        try {
            // Get the pricing token for this flight
            const pricingToken = pricingTokens[flight.id];
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
                    searchId: searchData.searchId,
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
                console.error('No booking URL returned from backend.');
            }

        } catch (error) {
            console.error('Failed to generate booking URL:', error);
            alert('Failed to generate booking URL. Please try again later.');
        } finally {
            setLoadingFlightId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Agent Message & Search Status */}
            {agentMessage && (
                <StatusMessage content={agentMessage} />
            )}

            {/* Progress Display */}
            {isSearching && status && (
                <ToolProgress
                    toolName="flight_search"
                    description={`Searching flights...`}
                    progress={status.progress.percentComplete}
                    progressText={`${status.progress.gatesCompleted}/${status.progress.gatesQueried} booking sites checked`}
                    isComplete={false}
                />
            )}

            {/* Error Display */}
            {error && (
                <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-800">{error}</span>
                    </div>
                </Card>
            )}

            {/* Progressive Flight Results */}
            {flights.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Flight Results ({flights.length} flights)
                        </h3>
                        
                        <div className="flex items-center gap-3">
                            {isSearching && (
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
                        {sortedFlights.map((flight) => {
                            const isLoading = loadingFlightId === flight.id;

                            return (
                                <Card 
                                    key={flight.id} 
                                    className={cn(
                                        "p-3 sm:p-4 hover:shadow-md transition-all duration-500"
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
                                                                    {flight.totalDuration}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {flight.totalStops > 0 && (
                                                            <div className="text-xs text-orange-600 font-medium whitespace-nowrap">
                                                                {flight.totalStops} stop{flight.totalStops > 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                        {flight.totalStops === 0 && (
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
                                                        <span className="truncate">{flight.airline}</span>
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

                                                {/* Segments */}
                                                <div className="border-t border-gray-200 mt-3 pt-3 space-y-3">
                                                    {flight.segments.map((segment, index) => (
                                                        <div key={index} className="flex items-center gap-4 text-xs">
                                                            <div className="font-semibold text-gray-500">
                                                                Leg {index + 1}
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium text-gray-800">{segment.origin} → {segment.destination}</span>
                                                                    <span className="text-gray-500">{segment.duration}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-gray-500">
                                                                    <span>{segment.airline} {segment.flightNumber}</span>
                                                                    <span>{segment.departureTime} - {segment.arrivalTime}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
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