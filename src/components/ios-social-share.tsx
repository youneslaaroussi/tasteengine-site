'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Share, 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram,
  Smartphone,
  Globe,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingFlightOption } from '@/types/flights';
import { trackUserEngagement } from '@/lib/gtag';

interface IOSSocialShareProps {
  flight: BookingFlightOption;
  children: React.ReactNode;
  className?: string;
  searchData?: any;
  pricingTokens?: Record<string, string>;
}

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

// iOS detection
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Safari detection
const isSafari = () => {
  if (typeof window === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Mobile detection
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export function IOSSocialShare({ flight, children, className, searchData, pricingTokens }: IOSSocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isGeneratingBookingUrl, setIsGeneratingBookingUrl] = useState(false);

  useEffect(() => {
    setIsIOSDevice(isIOS());
    setIsMobileDevice(isMobile());
  }, []);

  const generateBookingUrl = async (): Promise<string | null> => {
    if (!searchData?.searchId) {
      return null;
    }
    
    // Get the pricing token for this flight
    const pricingToken = pricingTokens?.[flight.id];
    if (!pricingToken) {
      console.error('Pricing token not found for flight:', flight.id);
      return null;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/generate-booking-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchId: searchData.searchId,
          termsUrl: pricingToken // Use the correct pricing token
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.bookingUrl || null;
    } catch (error) {
      console.error('Failed to generate booking URL:', error);
      return null;
    }
  };

  const generateShareData = async (bookingUrl?: string | null): Promise<ShareData> => {
    return {
      title: `✈️ ${flight.origin} → ${flight.destination} Flight Deal`,
      text: `Found an amazing flight deal! 🎯

🛫 ${flight.airline} 
📍 ${flight.origin} → ${flight.destination}
🗓️ ${flight.departureDate} at ${flight.departureTime}
⏱️ ${flight.totalDuration} • ${flight.totalStops === 0 ? 'Direct' : `${flight.totalStops} stop${flight.totalStops > 1 ? 's' : ''}`}
💰 ${flight.currency}${flight.price}

${flight.partnerInfo ? `Book via ${flight.partnerInfo.name || flight.partnerInfo.company || 'Partner'}` : ''}

${bookingUrl ? `Book here: ${bookingUrl}` : 'Book through GoFlyTo'}

#Travel #FlightDeals #GoFlyTo`,
      url: bookingUrl || undefined
    };
  };

  const handleNativeShare = async () => {
    setIsGeneratingBookingUrl(true);
    const bookingUrl = await generateBookingUrl();
    setIsGeneratingBookingUrl(false);
    const shareData = await generateShareData(bookingUrl);
    
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        trackUserEngagement('native_share_success', 'flight_share');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Native share failed:', error);
      trackUserEngagement('native_share_failed', 'flight_share');
    }
  };

  const handleCopyBookingLink = async () => {
    if (isGeneratingBookingUrl) return;
    setIsGeneratingBookingUrl(true);
    setCopiedPlatform(null);

    try {
        const bookingUrl = await generateBookingUrl();
        if (bookingUrl) {
            await navigator.clipboard.writeText(bookingUrl);
            setCopiedPlatform('clipboard');
            setTimeout(() => setCopiedPlatform(null), 2000);
            trackUserEngagement('copy_booking_link_success', 'flight_share');
        } else {
            alert('Could not generate a booking link. This option is only available from an active search.');
            trackUserEngagement('copy_booking_link_failed', 'flight_share');
        }
    } catch (error) {
        console.error('Failed to copy booking link:', error);
        alert('An error occurred while generating the booking link.');
    } finally {
        setIsGeneratingBookingUrl(false);
    }
  }

  const handleCopyShareText = async () => {
    const shareData = await generateShareData(); // Generates text without a booking URL for this case
    try {
        await navigator.clipboard.writeText(shareData.text);
        return true;
    } catch (error) {
        console.error('Copy share text to clipboard failed:', error);
        return false;
    }
  }

  const handleSocialShare = async (platform: string) => {
    if (platform === 'instagram') {
        const copied = await handleCopyShareText();
        if (copied) {
            setCopiedPlatform('instagram');
            alert('Flight details copied! Paste them in your Instagram post.');
            setTimeout(() => setCopiedPlatform(null), 3000);
        } else {
            alert('Could not copy flight details to clipboard.');
        }
        return;
    }

    setIsGeneratingBookingUrl(true);
    const bookingUrl = await generateBookingUrl();
    setIsGeneratingBookingUrl(false);
    const shareData = await generateShareData(bookingUrl);

    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url || '');
    const encodedTitle = encodeURIComponent(shareData.title);

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodedText}`;
        break;
      default:
        return;
    }

    if (shareUrl) {
      if (isIOSDevice && isSafari()) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(shareUrl, '_blank');
      }
      
      trackUserEngagement(`${platform}_share`, 'flight_share');
      setIsOpen(false);
    }
  };

  const shareOptions = [
    {
      id: 'native',
      name: 'Share...',
      icon: isGeneratingBookingUrl ? <Loader2 className="w-5 h-5 animate-spin"/> : <Share className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      action: handleNativeShare,
      show: isIOSDevice && navigator.share
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
      action: () => handleSocialShare('whatsapp'),
      show: true
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      action: () => handleSocialShare('twitter'),
      show: true
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      action: () => handleSocialShare('facebook'),
      show: true
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      action: () => handleSocialShare('telegram'),
      show: true
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-gray-50 text-gray-600',
      action: () => handleSocialShare('email'),
      show: true
    },
    {
      id: 'sms',
      name: 'Messages',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
      action: () => handleSocialShare('sms'),
      show: isMobileDevice
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: copiedPlatform === 'instagram' ? <Check className="w-5 h-5" /> : <Instagram className="w-5 h-5" />,
      color: 'bg-pink-50 text-pink-600',
      action: () => handleSocialShare('instagram'),
      show: true
    },
    {
      id: 'copy',
      name: isGeneratingBookingUrl ? 'Generating...' : 'Copy Link',
      icon: copiedPlatform === 'clipboard' ? <Check className="w-5 h-5" /> : isGeneratingBookingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />,
      color: copiedPlatform === 'clipboard' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600',
      action: handleCopyBookingLink,
      show: true
    }
  ];

  const visibleOptions = shareOptions.filter(option => option.show);

  // iOS uses Sheet, others use Dialog
  if (isIOSDevice || isMobileDevice) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center text-lg">Share Flight</SheetTitle>
            <div className="text-center text-sm text-gray-500">
              {flight.airline} • {flight.origin} → {flight.destination}
            </div>
          </SheetHeader>
          
          <div className="grid grid-cols-4 gap-2 pb-6">
            {visibleOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                disabled={isGeneratingBookingUrl && option.id !== 'copy'}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  option.color
                )}>
                  {option.icon}
                </div>
                <span className="text-xs text-center text-gray-600 font-medium">
                  {option.name}
                </span>
                {copiedPlatform === option.id && (
                  <span className="text-xs text-green-600">Copied!</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Flight</DialogTitle>
          <div className="text-sm text-gray-500">
            {flight.airline} • {flight.origin} → {flight.destination}
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          {visibleOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              onClick={option.action}
              disabled={isGeneratingBookingUrl && option.id !== 'copy'}
              className="flex items-center justify-start gap-3 h-12 px-4 disabled:opacity-50"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                option.color
              )}>
                {option.icon}
              </div>
              <span className="text-sm font-medium">
                {option.name}
              </span>
              {copiedPlatform === option.id && (
                <Check className="w-4 h-4 text-green-600 ml-auto" />
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 