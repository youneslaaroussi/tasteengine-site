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

    // Set canvas size
    const width = 600;
    const height = Math.max(400, 200 + (itinerary.flights.length * 120));
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    let currentY = 30;

    // Header
    addText(ctx, 'FLIGHT ITINERARY', width / 2, currentY, {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      fill: '#1a1a1a'
    });

    currentY += 40;

    // Trip details
    addText(ctx, `Trip: ${itinerary.tripName}`, 40, currentY, {
      fontSize: 16,
      fontWeight: 'bold'
    });
    currentY += 25;

    addText(ctx, `Traveler: ${itinerary.travelerName}`, 40, currentY, {
      fontSize: 14
    });
    currentY += 20;

    addText(ctx, `Created: ${new Date(itinerary.createdAt).toLocaleDateString()}`, 40, currentY, {
      fontSize: 12,
      fill: '#666666'
    });

    // Summary box
    currentY += 40;
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, currentY - 15, width - 80, 60);

    addText(ctx, `Total Flights: ${itinerary.summary.totalFlights}`, 50, currentY, {
      fontSize: 12
    });
    currentY += 20;

    addText(ctx, `Total Price: ${itinerary.summary.currency} ${itinerary.summary.totalPrice}`, 50, currentY, {
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#2563eb'
    });

    addText(ctx, `Route: ${itinerary.summary.origins} → ${itinerary.summary.destinations}`, 300, currentY - 20, {
      fontSize: 12
    });

    currentY += 40;

    // Flights
    itinerary.flights.forEach((flight, index) => {
      // Flight separator line
      if (index > 0) {
        addDashedLine(ctx, 40, currentY, width - 40, currentY);
        currentY += 20;
      }

      // Flight number and airline
      addText(ctx, `Flight ${flight.sequence} - ${flight.airline}`, 40, currentY, {
        fontSize: 16,
        fontWeight: 'bold'
      });

      addText(ctx, `${flight.aircraft} | ${flight.bookingClass} Class`, 400, currentY, {
        fontSize: 12,
        fill: '#666666'
      });

      currentY += 25;

      // Route
      addText(ctx, flight.origin.code, 40, currentY, {
        fontSize: 20,
        fontWeight: 'bold'
      });

      addText(ctx, flight.origin.city, 40, currentY + 18, {
        fontSize: 12,
        fill: '#666666'
      });

      // Arrow
      addText(ctx, '→', 150, currentY, {
        fontSize: 24,
        textAlign: 'center'
      });

      addText(ctx, flight.destination.code, 220, currentY, {
        fontSize: 20,
        fontWeight: 'bold'
      });

      addText(ctx, flight.destination.city, 220, currentY + 18, {
        fontSize: 12,
        fill: '#666666'
      });

      // Times
      addText(ctx, `Departure: ${flight.departure.time}`, 350, currentY, {
        fontSize: 12
      });

      addText(ctx, `Arrival: ${flight.arrival.time}`, 350, currentY + 15, {
        fontSize: 12
      });

      currentY += 40;

      // Duration and price
      addText(ctx, `Duration: ${flight.duration}`, 40, currentY, {
        fontSize: 12
      });

      addText(ctx, `Stops: ${flight.stops}`, 150, currentY, {
        fontSize: 12
      });

      addText(ctx, `${flight.price.currency} ${flight.price.amount}`, 450, currentY, {
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#2563eb'
      });

      currentY += 30;
    });

    // Notes
    if (itinerary.notes) {
      currentY += 20;
      addLine(ctx, 40, currentY, width - 40, currentY, {
        stroke: '#e5e5e5'
      });
      currentY += 25;

      addText(ctx, 'Notes:', 40, currentY, {
        fontSize: 14,
        fontWeight: 'bold'
      });
      currentY += 20;

      // Split notes into lines if too long
      const maxWidth = width - 80;
      const words = itinerary.notes.split(' ');
      let line = '';
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          addText(ctx, line.trim(), 40, currentY, {
            fontSize: 12
          });
          currentY += 18;
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line.trim()) {
        addText(ctx, line.trim(), 40, currentY, {
          fontSize: 12
        });
      }
    }

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