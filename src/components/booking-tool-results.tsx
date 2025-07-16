import { memo, useState } from 'react';
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
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Types based on the mock data structure
interface Flight {
    id: string;
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
    price: number;
    currency: string;
    availableSeats: number;
    baggageAllowance: string;
    cancellationPolicy: string;
    changePolicy: string;
    bookingUrl: string;
}

interface FlightSearchResult {
    searchId: string;
    flights: Flight[];
    pricingTokens: Record<string, any>;
}

interface BookingValidation {
    isValid: boolean;
    price: number;
    currency: string;
    availableSeats: number;
    warnings: string[];
    errors: string[];
}

interface BookingConfirmation {
    bookingId: string;
    status: string;
    confirmationCode: string;
    totalPrice: number;
    currency: string;
    flightDetails: {
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
    };
    passengerDetails: Array<{
        type: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: string;
        passportNumber: string;
        nationality: string;
    }>;
    contactInfo: {
        email: string;
        phone: string;
        address: {
            street: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
        };
    };
    bookingDate: string;
    terms: string[];
    cancellationPolicy: string;
    changePolicy: string;
}

// Flight Search Results Component
interface FlightSearchResultsProps {
    data: FlightSearchResult;
    onBook?: (flight: Flight) => void;
}

export const FlightSearchResults = memo(function FlightSearchResults({
    data,
    onBook
}: FlightSearchResultsProps) {
    const [loadingFlightId, setLoadingFlightId] = useState<string | null>(null);

    const handleBooking = async (flight: Flight) => {
        if (loadingFlightId) return; // Prevent multiple simultaneous bookings

        setLoadingFlightId(flight.id);
        console.log(data, flight);

        // Check for termsUrl in pricingTokens
        const termsUrl = data.pricingTokens[flight.id]?.termsUrl;
        if (!termsUrl) {
            console.error('Terms URL not found for flight:', flight.id);
            alert('Terms URL not found for flight');
            onBook?.(flight);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/generate-booking-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchId: data.searchId,
                    termsUrl: termsUrl,
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

            // Call the original onBook if provided
            onBook?.(flight);

        } catch (error) {
            console.error('Failed to generate booking URL:', error);
            // Fallback to original booking URL
            window.open(flight.bookingUrl, '_blank');
            onBook?.(flight);
        } finally {
            setLoadingFlightId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Flight Search Results ({data.flights.length} options)
                </h3>
            </div>

            <div className="space-y-3">
                {data.flights.map((flight) => {
                    const isLoading = loadingFlightId === flight.id;

                    return (
                        <Card key={flight.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-3">
                                    {/* Flight Route and Times */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-gray-900">{flight.origin}</div>
                                            <div className="text-sm font-medium text-blue-600">{flight.departureTime}</div>
                                        </div>

                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex-1 h-px bg-gray-300 relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-white px-2 text-xs text-gray-500">
                                                        {flight.duration}
                                                    </div>
                                                </div>
                                            </div>
                                            {flight.stops > 0 && (
                                                <div className="text-xs text-orange-600 font-medium">
                                                    {flight.stops} stop{flight.stops > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <div className="text-lg font-bold text-gray-900">{flight.destination}</div>
                                            <div className="text-sm font-medium text-blue-600">{flight.arrivalTime}</div>
                                        </div>
                                    </div>

                                    {/* Flight Details */}
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Plane className="w-4 h-4" />
                                            <span>{flight.airline} {flight.flightNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(flight.departureDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            <span>{flight.travelClass}</span>
                                        </div>
                                        <div className="text-green-600 font-medium">
                                            {flight.availableSeats} seats left
                                        </div>
                                    </div>

                                    {/* Policies */}
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <div>• {flight.baggageAllowance}</div>
                                        <div>• {flight.cancellationPolicy}</div>
                                        <div>• {flight.changePolicy}</div>
                                    </div>
                                </div>

                                {/* Price and Booking */}
                                <div className="ml-6 text-right space-y-3">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {flight.currency} {flight.price}
                                        </div>
                                        <div className="text-sm text-gray-500">per person</div>
                                    </div>

                                    <div className="space-y-2">
                                        <Button
                                            onClick={() => handleBooking(flight)}
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
                        </Card>
                    );
                })}
            </div>
        </div>
    );
});

// Booking Validation Component
interface BookingValidationProps {
    data: BookingValidation;
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

// Booking Confirmation Component
interface BookingConfirmationProps {
    data: BookingConfirmation;
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

            {/* Flight Details */}
            <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    Flight Details
                </h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Flight:</span>
                        <span className="ml-2 font-medium">{data.flightDetails.airline} {data.flightDetails.flightNumber}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Class:</span>
                        <span className="ml-2 font-medium">{data.flightDetails.travelClass}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Route:</span>
                        <span className="ml-2 font-medium">{data.flightDetails.origin} → {data.flightDetails.destination}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-medium">{data.flightDetails.duration}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Departure:</span>
                        <span className="ml-2 font-medium">{data.flightDetails.departureTime} on {new Date(data.flightDetails.departureDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Arrival:</span>
                        <span className="ml-2 font-medium">{data.flightDetails.arrivalTime}</span>
                    </div>
                </div>
            </Card>

            {/* Passenger Details */}
            <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Passenger Details
                </h4>

                {data.passengerDetails.map((passenger, index) => (
                    <div key={index} className="space-y-2 text-sm">
                        <div className="font-medium text-gray-900">
                            {passenger.firstName} {passenger.lastName} ({passenger.type})
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-gray-600">
                            <div>Date of Birth: {new Date(passenger.dateOfBirth).toLocaleDateString()}</div>
                            <div>Gender: {passenger.gender}</div>
                            <div>Passport: {passenger.passportNumber}</div>
                            <div>Nationality: {passenger.nationality}</div>
                        </div>
                    </div>
                ))}
            </Card>

            {/* Contact Information */}
            <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Information
                </h4>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{data.contactInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{data.contactInfo.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <Home className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span>
                            {data.contactInfo.address.street}, {data.contactInfo.address.city},
                            {data.contactInfo.address.state} {data.contactInfo.address.postalCode},
                            {data.contactInfo.address.country}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Terms and Policies */}
            <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Terms & Policies</h4>

                <div className="space-y-2 text-sm text-gray-600">
                    <div>
                        <span className="font-medium text-gray-900">Cancellation:</span> {data.cancellationPolicy}
                    </div>
                    <div>
                        <span className="font-medium text-gray-900">Changes:</span> {data.changePolicy}
                    </div>

                    {data.terms.length > 0 && (
                        <div className="mt-3">
                            <span className="font-medium text-gray-900">Terms:</span>
                            <ul className="mt-1 ml-4 space-y-1">
                                {data.terms.map((term, index) => (
                                    <li key={index}>• {term}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
});

// Booking Cancellation Component
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

// Affiliate Links Component
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