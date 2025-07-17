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
    ExternalLink,
    Clock,
    MapPin,
    Heart,
    Share,
    Check,
    Copy
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
import { useSavedFlights } from '@/contexts/saved-flights-context';
import { IOSSocialShare } from '@/components/ios-social-share';



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

    const { savedFlights, toggleSavedFlight, isSavedFlightLoading } = useSavedFlights();

    // Store flight data in localStorage for saved flights modal
    useEffect(() => {
        if (flights.length > 0) {
            try {
                const existingData = localStorage.getItem('allFlightData');
                let allFlightData = existingData ? JSON.parse(existingData) : [];
                
                // Add new flights to existing data, avoiding duplicates
                const newFlights = flights.filter(flight => 
                    !allFlightData.some((existing: any) => existing.id === flight.id)
                );
                
                if (newFlights.length > 0) {
                    allFlightData = [...allFlightData, ...newFlights];
                    localStorage.setItem('allFlightData', JSON.stringify(allFlightData));
                }
            } catch (error) {
                console.error('Error storing flight data:', error);
            }
        }
    }, [flights]);

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
    const [activeTab, setActiveTab] = useState<'best' | 'cheapest' | 'fastest'>('best');

    const [loadingFlightId, setLoadingFlightId] = useState<string | null>(null);
    const [expandedFlight, setExpandedFlight] = useState<string | null>(null);

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

    const handleTabChange = (tab: 'best' | 'cheapest' | 'fastest') => {
        setActiveTab(tab);
        switch (tab) {
            case 'cheapest':
                setSortConfig({ option: 'price', direction: 'asc' });
                break;
            case 'fastest':
                setSortConfig({ option: 'duration', direction: 'asc' });
                break;
            case 'best':
            default:
                setSortConfig({ option: 'price', direction: 'asc' });
                break;
        }
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

    const handleHeartClick = (e: React.MouseEvent, flight: BookingFlightOption) => {
        e.stopPropagation();
        const isSaved = savedFlights.has(flight.id);
        if (isSaved) {
            // Remove from saved
            toggleSavedFlight(flight.id);
        } else {
            // Add to saved, including the necessary details for booking
            const pricingToken = pricingTokens[flight.id];
            if (pricingToken && searchData?.searchId) {
                toggleSavedFlight(flight.id, {
                    pricingToken,
                    searchId: searchData.searchId
                });
            } else {
                console.error('Cannot save flight without pricing token and search ID');
                // Optionally alert the user
                alert('This flight cannot be saved as its booking details are incomplete.');
            }
        }
    };

    return (
        <div className="space-y-2">
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

            {/* Flight Results */}
            {flights.length > 0 && (
                <div className="space-y-2">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                        <button
                            onClick={() => handleTabChange('best')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                activeTab === 'best' 
                                    ? "bg-blue-600 text-white shadow-sm" 
                                    : "text-gray-700 hover:text-gray-900"
                            )}
                        >
                            Best
                        </button>
                        <button
                            onClick={() => handleTabChange('cheapest')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                activeTab === 'cheapest' 
                                    ? "bg-blue-600 text-white shadow-sm" 
                                    : "text-gray-700 hover:text-gray-900"
                            )}
                        >
                            Cheapest
                        </button>
                        <button
                            onClick={() => handleTabChange('fastest')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                activeTab === 'fastest' 
                                    ? "bg-blue-600 text-white shadow-sm" 
                                    : "text-gray-700 hover:text-gray-900"
                            )}
                        >
                            Fastest
                        </button>
                    </div>

                    {/* Flight Cards */}
                    <div className="space-y-2">
                        {sortedFlights.map((flight) => {
                            const isLoading = loadingFlightId === flight.id;
                            const isExpanded = expandedFlight === flight.id;
                            const isSaved = savedFlights.has(flight.id);

                            return (
                                <Card 
                                    key={flight.id} 
                                    className="bg-white border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                                    onClick={() => setExpandedFlight(isExpanded ? null : flight.id)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            {/* Left side - Airline info */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <Plane className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">{flight.airline}</div>
                                                </div>
                                            </div>

                                            {/* Right side - Share and Heart icons */}
                                            <div className="flex items-center gap-2">
                                                <IOSSocialShare flight={flight} searchData={searchData} pricingTokens={pricingTokens}>
                                                    <button 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        title="Share flight"
                                                    >
                                                        <Share className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                                    </button>
                                                </IOSSocialShare>
                                                <button 
                                                    onClick={(e) => handleHeartClick(e, flight)}
                                                    className={cn(
                                                        "p-1 hover:bg-gray-100 rounded transition-colors",
                                                        savedFlights.has(flight.id) && "bg-red-50"
                                                    )}
                                                    title={savedFlights.has(flight.id) ? "Remove from saved" : "Save flight"}
                                                    disabled={isSavedFlightLoading}
                                                >
                                                    <Heart className={cn(
                                                        "w-4 h-4 transition-colors",
                                                        savedFlights.has(flight.id)
                                                            ? "text-red-500 fill-red-500" 
                                                            : "text-gray-400 hover:text-red-500"
                                                    )} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Flight Details */}
                                        <div className="mt-3 flex items-center justify-between">
                                            {/* Flight Times and Route */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-bold text-gray-900">{flight.departureTime}</span>
                                                    <span className="text-gray-500">-</span>
                                                    <span className="font-bold text-gray-900">{flight.arrivalTime}</span>
                                                    <span className="text-xs text-gray-500">+{flight.totalStops > 0 ? flight.totalStops : 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <span>{flight.origin} - {flight.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                    <span>{flight.totalDuration}</span>
                                                    <span>
                                                        {flight.totalStops === 0 ? (
                                                            <span className="text-green-600 font-medium">Direct</span>
                                                        ) : (
                                                            <span className="text-red-500 font-medium">
                                                                {flight.totalStops} stop{flight.totalStops > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                {flight.segments.length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Partly operated by {flight.segments[0].airline}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price and Partner */}
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-gray-900">
                                                    {flight.currency}{flight.price}
                                                </div>
                                                {flight.partnerInfo && (
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span>via {flight.partnerInfo.name || flight.partnerInfo.company || 'Partner'}</span>
                                                    </div>
                                                )}
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBookFlight(flight);
                                                    }}
                                                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 text-sm"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Book Now'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t bg-gray-50 p-4">
                                            <div className="space-y-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Flight Details</h4>
                                                    <div className="space-y-2">
                                                        {flight.segments.map((segment, index) => (
                                                            <div key={index} className="text-sm">
                                                                <div className="flex justify-between">
                                                                    <span>{segment.origin} → {segment.destination}</span>
                                                                    <span className="text-gray-500">{segment.duration}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {segment.airline} {segment.flightNumber} • {segment.departureTime} - {segment.arrivalTime}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    <div>Baggage: {flight.baggageAllowance}</div>
                                                    <div>Cancellation: {flight.cancellationPolicy}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {/* Loading more indicator */}
                    {isSearching && (
                        <div className="text-center py-4">
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading more flights...</span>
                            </div>
                        </div>
                    )}
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
        <div className="space-y-2">
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