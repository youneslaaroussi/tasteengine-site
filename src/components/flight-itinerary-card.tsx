import { memo, useEffect, useRef, useState } from 'react';
import { PrinterIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  };
}

export const FlightItineraryCard = memo(function FlightItineraryCard({
  itinerary,
}: FlightItineraryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const addText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fill?: string;
    textAlign?: CanvasTextAlign;
  } = {}) => {
    const {
      fontSize = 14,
      fontFamily = 'Arial',
      fontWeight = 'normal',
      fill = '#000000',
      textAlign = 'left'
    } = options;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fill;
    ctx.textAlign = textAlign;
    ctx.fillText(text, x, y);
  };

  const addLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, options: {
    stroke?: string;
    strokeWidth?: number;
  } = {}) => {
    const { stroke = '#000000', strokeWidth = 1 } = options;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  };

  const addDashedLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash pattern
  };

  const renderCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoading(true);

    // Calculate proper height based on content
    const width = 600;
    let estimatedHeight = 100; // Top margin and header
    estimatedHeight += 120; // Trip info section
    estimatedHeight += 100; // Summary section
    estimatedHeight += 40; // Flight details header
    estimatedHeight += itinerary.flights.length * 140; // Flights (140px per flight)
    
    // Add height for notes if they exist
    if (itinerary.notes) {
      const noteLines = Math.ceil(itinerary.notes.length / 60); // ~60 chars per line
      estimatedHeight += 80 + (noteLines * 15); // Notes header + lines
    }
    
    estimatedHeight += 80; // Footer
    
    const height = Math.max(estimatedHeight, 500);
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const margin = 40;
    let currentY = margin;

    // Header - Receipt style
    addText(ctx, 'FLIGHT ITINERARY', width / 2, currentY, {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      fontFamily: 'JetBrains Mono, monospace'
    });

    currentY += 30;
    // Header line
    addLine(ctx, margin, currentY, width - margin, currentY, { strokeWidth: 2 });
    currentY += 25;

    // Trip and traveler info - Receipt style
    addText(ctx, `TRIP: ${itinerary.tripName}`, margin, currentY, {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'JetBrains Mono, monospace'
    });
    currentY += 20;

    addText(ctx, `PASSENGER: ${itinerary.travelerName}`, margin, currentY, {
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace'
    });
    currentY += 20;

    addText(ctx, `DATE: ${new Date(itinerary.createdAt).toLocaleDateString()}`, margin, currentY, {
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace'
    });
    currentY += 20;

    addText(ctx, `REF: ${itinerary.id || 'N/A'}`, margin, currentY, {
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace'
    });
    currentY += 30;

    // Summary section - Receipt style
    addLine(ctx, margin, currentY, width - margin, currentY, { stroke: '#666666' });
    currentY += 20;

    addText(ctx, 'SUMMARY', margin, currentY, {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'JetBrains Mono, monospace'
    });
    currentY += 25;

    // Summary items - Receipt style with right alignment
    const summaryItems = [
      [`FLIGHTS:`, `${itinerary.summary.totalFlights}`],
      [`ROUTE:`, `${itinerary.summary.origins} → ${itinerary.summary.destinations}`],
      [`TOTAL:`, `${itinerary.summary.currency} ${itinerary.summary.totalPrice}`]
    ];

    summaryItems.forEach(([label, value]) => {
      addText(ctx, label, margin, currentY, {
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace'
      });
      addText(ctx, value, width - margin, currentY, {
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        textAlign: 'right'
      });
      currentY += 18;
    });

    currentY += 15;

    // Flights section
    addLine(ctx, margin, currentY, width - margin, currentY, { stroke: '#666666' });
    currentY += 20;

    addText(ctx, 'FLIGHT DETAILS', margin, currentY, {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'JetBrains Mono, monospace'
    });
    currentY += 25;

    itinerary.flights.forEach((flight, index) => {
      // Flight header - airline and price
      addText(ctx, `${flight.sequence}. ${flight.airline}`, margin, currentY, {
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: 'JetBrains Mono, monospace'
      });

      addText(ctx, `${flight.price.currency} ${flight.price.amount}`, width - margin, currentY, {
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: 'JetBrains Mono, monospace',
        textAlign: 'right'
      });
      currentY += 18;

      // Aircraft and class
      addText(ctx, `   ${flight.aircraft} • ${flight.bookingClass}`, margin, currentY, {
        fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        fill: '#666666'
      });
      currentY += 15;

      // Route details - Receipt style
      const routeDetails = [
        [`   FROM:`, `${flight.origin.code} - ${flight.origin.city}`],
        [`   `, `${flight.departure.time} ${flight.departure.date}`],
        [`   TO:`, `${flight.destination.code} - ${flight.destination.city}`],
        [`   `, `${flight.arrival.time} ${flight.arrival.date}`],
        [`   STOPS:`, flight.stops === 0 ? 'Direct Flight' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`]
      ];

      routeDetails.forEach(([label, value]) => {
        if (label.trim()) {
          addText(ctx, label, margin, currentY, {
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            fill: '#666666'
          });
          addText(ctx, value, margin + 80, currentY, {
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace'
          });
        } else {
          addText(ctx, value, margin + 80, currentY, {
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            fill: '#666666'
          });
        }
        currentY += 14;
      });

      // Space between flights
      if (index < itinerary.flights.length - 1) {
        currentY += 15;
        addLine(ctx, margin + 10, currentY, width - margin - 10, currentY, {
          stroke: '#cccccc',
          strokeWidth: 1
        });
        currentY += 15;
      }
    });

    // Notes section if exists
    if (itinerary.notes) {
      currentY += 20;
      addLine(ctx, margin, currentY, width - margin, currentY, { stroke: '#666666' });
      currentY += 20;

      addText(ctx, 'NOTES', margin, currentY, {
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'JetBrains Mono, monospace'
      });
      currentY += 25;

      // Word wrap notes - receipt style
      const words = itinerary.notes.split(' ');
      let line = '';
      const maxChars = 60; // Characters per line for receipt

      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length > maxChars && line) {
          addText(ctx, line, margin, currentY, {
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace'
          });
          currentY += 15;
          line = word;
        } else {
          line = testLine;
        }
      });

      if (line) {
        addText(ctx, line, margin, currentY, {
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace'
        });
        currentY += 25;
      }
    }

    // Footer - Receipt style
    currentY += 20;
    addLine(ctx, margin, currentY, width - margin, currentY, { stroke: '#666666' });
    currentY += 15;

    addText(ctx, 'Generated by GoFlyTo Travel Assistant', margin, currentY, {
      fontSize: 8,
      fontFamily: 'JetBrains Mono, monospace',
      fill: '#666666'
    });

    currentY += 15;
    addText(ctx, 'THANK YOU FOR CHOOSING OUR SERVICE', width / 2, currentY, {
      fontSize: 9,
      fontFamily: 'JetBrains Mono, monospace',
      textAlign: 'center',
      fill: '#666666'
    });

    setIsLoading(false);
  };

  const handleSaveAsImage = async () => {
    if (!canvasRef.current) return;

    try {
      // Convert canvas to high-quality image
      const dataURL = canvasRef.current.toDataURL('png', 1.0);

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

  const handleRerender = () => {
    renderCanvas();
  };

  useEffect(() => {
    renderCanvas();
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