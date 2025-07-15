import { memo, useEffect, useRef, useState } from 'react';
import { PrinterIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fabric } from 'fabric';

interface FlightItineraryCardProps {
  itinerary: {
    id: string;
    createdAt: string;
    travelerName: string;
    tripName: string;
    notes: string;
    summary: {
      totalFlights: number;
      totalPrice: number;
      currency: string;
      destinations: string;
      origins: string;
    };
    flights: Array<{
      sequence: number;
      id: string;
      origin: {
        code: string;
        city: string;
      };
      destination: {
        code: string;
        city: string;
      };
      departure: {
        dateTime: string;
        date: string;
        time: string;
      };
      arrival: {
        dateTime: string;
        date: string;
        time: string;
      };
      airline: string;
      price: {
        amount: number;
        currency: string;
      };
      duration: string;
      stops: number;
      aircraft: string;
      bookingClass: string;
    }>;
    metadata: {
      generatedBy: string;
      version: string;
      format: string;
    };
  };
  json?: string;
}

export const FlightItineraryCard = memo(function FlightItineraryCard({ itinerary, json }: FlightItineraryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Defensive checks
  if (!itinerary) {
    console.error('FlightItineraryCard: itinerary prop is required');
    return <div className="text-red-500 p-4">Error: Missing itinerary data</div>;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      // Handle different date formats
      let date: Date;
      
      if (dateString.includes('T')) {
        // ISO format like "2025-07-15T21:56:18.568Z"
        date = new Date(dateString);
      } else if (dateString.includes(' ')) {
        // Format like "2025-07-20 14:30:00 EDT" - extract just the date part
        const datePart = dateString.split(' ')[0];
        date = new Date(datePart);
      } else {
        // Try to parse as-is
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    
    try {
      let time: string;
      
      if (timeString.includes('T')) {
        // ISO format like "2025-07-15T21:56:18.568Z"
        time = timeString.split('T')[1].split('.')[0].slice(0, 5);
      } else if (timeString.includes(' ')) {
        // Format like "2025-07-20 14:30:00 EDT" - extract time part
        const parts = timeString.split(' ');
        if (parts.length >= 2) {
          time = parts[1].slice(0, 5); // Get HH:MM
        } else {
          time = timeString.slice(0, 5);
        }
      } else {
        // Simple time format
        time = timeString.slice(0, 5);
      }
      
      return time;
    } catch {
      return timeString;
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount || 0);
    } catch {
      return `${currency || 'USD'} ${amount || 0}`;
    }
  };

  const addText = (canvas: fabric.Canvas, text: string, x: number, y: number, options: any = {}) => {
    const textObj = new fabric.Text(text, {
      left: x,
      top: y,
      fontFamily: 'Courier New, monospace',
      fill: '#000000',
      selectable: false,
      evented: false,
      ...options
    });
    canvas.add(textObj);
    return textObj;
  };

  const addLine = (canvas: fabric.Canvas, x1: number, y1: number, x2: number, y2: number, options: any = {}) => {
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: '#000000',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      ...options
    });
    canvas.add(line);
    return line;
  };

  const addDashedLine = (canvas: fabric.Canvas, x1: number, y1: number, x2: number, y2: number) => {
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: '#666666',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    });
    canvas.add(line);
    return line;
  };

  const renderCanvas = async () => {
    if (!canvasRef.current) return;

    // Get container width and calculate responsive dimensions
    const container = canvasRef.current.parentElement;
    const containerWidth = container ? container.clientWidth : 800;
    
    // Set canvas width
    const width = Math.min(containerWidth - 40, 600); // Max 600px, receipt-style
    
    // Scale factor for responsive sizing
    const scale = width / 600; // Base size 600px
    const margin = 40 * scale;
    const contentWidth = width - (margin * 2);

    // Calculate required height based on content
    let requiredHeight = margin; // Start with top margin

    // Header section height
    requiredHeight += 30 * scale; // Title
    requiredHeight += 30 * scale; // Line + spacing
    requiredHeight += 20 * scale; // Trip details
    requiredHeight += 20 * scale; // Passenger
    requiredHeight += 15 * scale; // Date
    requiredHeight += 15 * scale; // Reference
    requiredHeight += 25 * scale; // Spacing

    // Summary section height
    if (Object.keys(itinerary.summary || {}).length > 0) {
      requiredHeight += 20 * scale; // Dashed line + spacing
      requiredHeight += 20 * scale; // Summary title
      requiredHeight += 20 * scale; // Summary title spacing
      requiredHeight += 3 * 18 * scale; // 3 summary items
      requiredHeight += 10 * scale; // Bottom spacing
    }

    // Flights section height
    if ((itinerary.flights || []).length > 0) {
      requiredHeight += 20 * scale; // Dashed line + spacing
      requiredHeight += 25 * scale; // Flight details title + spacing

      const flightsToShow = (itinerary.flights || []).slice(0, 4);
      flightsToShow.forEach((flight, index) => {
        requiredHeight += 18 * scale; // Flight name + price
        requiredHeight += 15 * scale; // Aircraft + class
        
        // Route details - count actual items
        let routeItemCount = 0;
        if (flight.origin?.code || flight.origin?.city) routeItemCount++;
        if (flight.departure?.time || flight.departure?.dateTime || flight.departure?.date) routeItemCount++;
        if (flight.destination?.code || flight.destination?.city) routeItemCount++;
        if (flight.arrival?.time || flight.arrival?.dateTime || flight.arrival?.date) routeItemCount++;
        if (flight.duration) routeItemCount++;
        if (typeof flight.stops === 'number') routeItemCount++;
        
        requiredHeight += routeItemCount * 14 * scale;
        
        // Space between flights
        if (index < flightsToShow.length - 1) {
          requiredHeight += 30 * scale; // Line + spacing
        }
      });

      requiredHeight += 20 * scale; // Bottom spacing
    }

    // Notes section height
    if (itinerary.notes) {
      requiredHeight += 20 * scale; // Dashed line + spacing
      requiredHeight += 20 * scale; // Notes title
      requiredHeight += 20 * scale; // Notes title spacing
      
      // Estimate height for notes text (rough calculation)
      const noteWords = itinerary.notes.split(' ');
      const maxLineLength = 50 * scale;
      let lineCount = 1;
      let currentLine = '';
      
      noteWords.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (testLine.length > maxLineLength && currentLine) {
          lineCount++;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      requiredHeight += lineCount * 15 * scale;
      requiredHeight += 25 * scale; // Bottom spacing
    }

    // Footer height
    requiredHeight += 15 * scale; // Dashed line + spacing
    requiredHeight += 15 * scale; // Generated by text
    requiredHeight += 15 * scale; // Thank you text
    requiredHeight += margin; // Bottom margin

    const height = Math.max(requiredHeight, 200 * scale); // Minimum height

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: '#ffffff'
    });

    fabricCanvasRef.current = canvas;

    let currentY = margin;

    // Header - Company/Service name
    addText(canvas, 'FLIGHT ITINERARY', margin, currentY, {
      fontSize: 16 * scale,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    });

    currentY += 30 * scale;
    addLine(canvas, margin, currentY, width - margin, currentY, { strokeWidth: 2 });
    currentY += 20 * scale;

    // Trip details
    addText(canvas, `TRIP: ${itinerary.tripName || 'Flight Itinerary'}`, margin, currentY, {
      fontSize: 12 * scale,
      fontWeight: 'bold'
    });
    currentY += 20 * scale;

    addText(canvas, `PASSENGER: ${itinerary.travelerName || 'Unknown Traveler'}`, margin, currentY, {
      fontSize: 12 * scale
    });
    currentY += 15 * scale;

    addText(canvas, `DATE: ${formatDate(itinerary.createdAt || new Date().toISOString())}`, margin, currentY, {
      fontSize: 12 * scale
    });
    currentY += 15 * scale;

    addText(canvas, `REF: ${itinerary.id || 'N/A'}`, margin, currentY, {
      fontSize: 12 * scale
    });
    currentY += 25 * scale;

    // Summary section
    const summary = itinerary.summary || {};
    if (Object.keys(summary).length > 0) {
      addDashedLine(canvas, margin, currentY, width - margin, currentY);
      currentY += 20 * scale;

      addText(canvas, 'SUMMARY', margin, currentY, {
        fontSize: 12 * scale,
        fontWeight: 'bold'
      });
      currentY += 20 * scale;

      // Summary items in receipt format
      const summaryItems = [
        [`FLIGHTS:`, `${summary.totalFlights || 0}`],
        [`ROUTE:`, `${summary.origins || 'XXX'} → ${summary.destinations || 'XXX'}`],
        [`TOTAL:`, `${formatPrice(summary.totalPrice || 0, summary.currency || 'USD')}`]
      ];

      summaryItems.forEach(([label, value]) => {
        addText(canvas, label, margin, currentY, {
          fontSize: 11 * scale
        });
        addText(canvas, value, width - margin, currentY, {
          fontSize: 11 * scale,
          textAlign: 'right',
          originX: 'right'
        });
        currentY += 18 * scale;
      });

      currentY += 10 * scale;
    }

    // Flights section
    const flights = itinerary.flights || [];
    if (flights.length > 0) {
      addDashedLine(canvas, margin, currentY, width - margin, currentY);
      currentY += 20 * scale;

      addText(canvas, 'FLIGHT DETAILS', margin, currentY, {
        fontSize: 12 * scale,
        fontWeight: 'bold'
      });
      currentY += 25 * scale;

      flights.slice(0, 4).forEach((flight, index) => { // Limit to 4 flights
        // Flight number and airline
        addText(canvas, `${flight.sequence || index + 1}. ${flight.airline || 'Unknown Airline'}`, margin, currentY, {
          fontSize: 11 * scale,
          fontWeight: 'bold'
        });
        
        // Price aligned to right
        addText(canvas, formatPrice(flight.price?.amount || 0, flight.price?.currency || 'USD'), width - margin, currentY, {
          fontSize: 11 * scale,
          fontWeight: 'bold',
          textAlign: 'right',
          originX: 'right'
        });
        currentY += 18 * scale;

        // Aircraft and class
        addText(canvas, `${flight.aircraft || 'Unknown'} • ${flight.bookingClass || 'Economy'}`, margin + 10 * scale, currentY, {
          fontSize: 10 * scale,
          fill: '#666666'
        });
        currentY += 15 * scale;

        // Route details
        const routeDetails = [];

        // FROM
        if (flight.origin?.code || flight.origin?.city) {
          let from = '';
          if (flight.origin?.code) from += flight.origin.code;
          if (flight.origin?.city) from += (from ? ' - ' : '') + flight.origin.city;
          routeDetails.push([`FROM:`, from]);
        }

        // Departure time/date
        if (flight.departure?.time || flight.departure?.dateTime || flight.departure?.date) {
          const depTime = formatTime(flight.departure?.time || flight.departure?.dateTime || '');
          const depDate = formatDate(flight.departure?.date || flight.departure?.dateTime || '');
          if (depTime || depDate) {
            routeDetails.push([``, `${depTime}${depTime && depDate ? ' ' : ''}${depDate}`.trim()]);
          }
        }

        // TO
        if (flight.destination?.code || flight.destination?.city) {
          let to = '';
          if (flight.destination?.code) to += flight.destination.code;
          if (flight.destination?.city) to += (to ? ' - ' : '') + flight.destination.city;
          routeDetails.push([`TO:`, to]);
        }

        // Arrival time/date
        if (flight.arrival?.time || flight.arrival?.dateTime || flight.arrival?.date) {
          const arrTime = formatTime(flight.arrival?.time || flight.arrival?.dateTime || '');
          const arrDate = formatDate(flight.arrival?.date || flight.arrival?.dateTime || '');
          if (arrTime || arrDate) {
            routeDetails.push([``, `${arrTime}${arrTime && arrDate ? ' ' : ''}${arrDate}`.trim()]);
          }
        }

        // DURATION
        if (flight.duration) {
          routeDetails.push([`DURATION:`, flight.duration]);
        }

        // STOPS
        if (typeof flight.stops === 'number') {
          routeDetails.push([`STOPS:`, flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`]);
        }

        routeDetails.forEach(([label, value]) => {
          if (label) {
            addText(canvas, label, margin + 20 * scale, currentY, {
              fontSize: 9 * scale,
              fill: '#666666'
            });
            addText(canvas, value, margin + 80 * scale, currentY, {
              fontSize: 9 * scale
            });
          } else {
            addText(canvas, value, margin + 80 * scale, currentY, {
              fontSize: 9 * scale,
              fill: '#666666'
            });
          }
          currentY += 14 * scale;
        });

        // Add space between flights
        if (index < flights.length - 1) {
          currentY += 15 * scale;
          addLine(canvas, margin + 10 * scale, currentY, width - margin - 10 * scale, currentY, {
            stroke: '#cccccc',
            strokeWidth: 1
          });
          currentY += 15 * scale;
        }
      });

      currentY += 20 * scale;
    }

    // Notes section
    if (itinerary.notes) {
      addDashedLine(canvas, margin, currentY, width - margin, currentY);
      currentY += 20 * scale;

      addText(canvas, 'NOTES', margin, currentY, {
        fontSize: 12 * scale,
        fontWeight: 'bold'
      });
      currentY += 20 * scale;

      // Word wrap notes
      const noteWords = itinerary.notes.split(' ');
      let currentLine = '';
      const maxLineLength = 50 * scale;

      noteWords.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (testLine.length > maxLineLength && currentLine) {
          addText(canvas, currentLine, margin, currentY, {
            fontSize: 10 * scale
          });
          currentY += 15 * scale;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        addText(canvas, currentLine, margin, currentY, {
          fontSize: 10 * scale
        });
        currentY += 25 * scale;
      }
    }

    // Footer
    addDashedLine(canvas, margin, currentY, width - margin, currentY);
    currentY += 15 * scale;

    addText(canvas, `Generated by ${itinerary.metadata?.generatedBy || 'Travel Assistant'}`, margin, currentY, {
      fontSize: 8 * scale,
      fill: '#666666'
    });

    // Thank you message (receipt style)
    currentY += 15 * scale;
    addText(canvas, 'THANK YOU FOR CHOOSING OUR SERVICE', width / 2, currentY, {
      fontSize: 9 * scale,
      textAlign: 'center',
      originX: 'center',
      fill: '#666666'
    });

    canvas.renderAll();
    setIsLoading(false);
  };

  const handleRerender = () => {
    setIsLoading(true);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }
    setTimeout(() => {
      renderCanvas();
    }, 100);
  };

  const handleSaveAsImage = async () => {
    if (!fabricCanvasRef.current) return;

    try {
      // Convert canvas to high-quality image
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 // 2x resolution for crisp display
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `flight-itinerary-${itinerary.id || 'receipt'}.png`;
      link.href = dataURL;
      
      // For mobile, try to trigger gallery save
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // Create a new window/tab with the image for mobile save
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <img src="${dataURL}" style="width: 100%; height: auto;" />
            <p style="text-align: center; font-family: Arial, sans-serif; margin: 20px;">
              Tap and hold the image above, then select "Save to Photos" or "Download Image"
            </p>
          `);
        }
      } else {
        // Desktop download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  useEffect(() => {
    renderCanvas();

    // Handle window resize for responsive canvas
    const handleResize = () => {
      // Debounce resize to avoid too many re-renders
      setTimeout(() => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
        }
        renderCanvas();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [itinerary]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Canvas Container */}
      <div className="relative bg-white border border-gray-300 rounded-none shadow-sm overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto block"
          style={{ 
            maxWidth: '100%', 
            height: 'auto',
            display: 'block'
          }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-gray-600">Generating receipt...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex justify-center gap-3">
        {process.env.NODE_ENV === 'development' && (
          <Button
            onClick={handleRerender}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
            Rerender
          </Button>
        )}
        <Button
          onClick={handleSaveAsImage}
          variant="outline"
          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          <PrinterIcon className="w-4 h-4" />
          Print Itinerary
        </Button>
      </div>
    </div>
  );
}); 