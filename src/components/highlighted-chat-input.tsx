'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from 'react'
import { HighlightWithinTextarea } from 'react-highlight-within-textarea'
import { cn } from '@/lib/utils'

interface HighlightedChatInputProps {  
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  rows?: number
}

export const HighlightedChatInput = forwardRef<HTMLTextAreaElement, HighlightedChatInputProps>(
  ({ value, onChange, onKeyDown, placeholder, className, style, disabled, rows = 1 }, ref) => {
    const highlightRef = useRef<any>(null)
    
    // Forward ref to the underlying textarea
    useImperativeHandle(ref, () => {
      return highlightRef.current?.textareaRef?.current || null
    }, [])

    const handleChange = useCallback((value: string) => {
      // Create a synthetic event to match the expected onChange signature
      const syntheticEvent = {
        target: { value }
      } as React.ChangeEvent<HTMLTextAreaElement>
      onChange(syntheticEvent)
    }, [onChange])

    // Handle keyboard events using useEffect
    useEffect(() => {
      const textarea = highlightRef.current?.textareaRef?.current
      if (textarea && onKeyDown) {
        const handleKeyDown = (e: KeyboardEvent) => {
          onKeyDown(e as any)
        }
        textarea.addEventListener('keydown', handleKeyDown)
        return () => textarea.removeEventListener('keydown', handleKeyDown)
      }
    }, [onKeyDown])

    // Define highlighting patterns with colors
    const highlightRules = [
      // URLs - Blue
      {
        highlight: /https?:\/\/[^\s]+|www\.[^\s]+/gi,
        className: 'highlight-url'
      },
      // Email addresses - Purple  
      {
        highlight: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        className: 'highlight-email'
      },
      // Dates - Orange
      {
        highlight: /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi,
        className: 'highlight-date'
      },
      // Locations - Green
      {
        highlight: /\b(?:USA|US|United States|UK|United Kingdom|Canada|France|Germany|Italy|Spain|Japan|China|India|Australia|Brazil|Mexico|Russia|South Korea|Netherlands|Sweden|Norway|Denmark|Finland|Switzerland|New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Francisco|Seattle|Boston|Miami|Atlanta|Las Vegas|Washington|Portland|Denver|Austin|Dallas|Orlando|Nashville|Detroit|Pittsburgh|Baltimore|Cleveland|Milwaukee|Minneapolis|Tampa|Sacramento|San Diego|San Antonio|San Jose|Charlotte|Jacksonville|Columbus|Indianapolis|Memphis|Louisville|Buffalo|Newark|Toledo|Madison|Raleigh|Virginia Beach|Colorado Springs|Mesa|Long Beach|Fresno|Tucson|Omaha|Oakland|Tulsa|Wichita|Arlington|Bakersfield|Aurora|Anaheim|Santa Ana|Riverside|Corpus Christi|Lexington|Stockton|Henderson|Saint Paul|Plano|Lincoln|Irvine|Chesapeake|Greensboro|Norfolk|Lubbock|Winston-Salem|Glendale|Hialeah|Garland|Irving|Scottsdale|North Las Vegas|Boise|Richmond|Spokane)\b/gi,
        className: 'highlight-location'
      },
      // Brand names - Red
      {
        highlight: /\b(?:Apple|Google|Microsoft|Amazon|Meta|Facebook|Instagram|Twitter|X|LinkedIn|TikTok|YouTube|Netflix|Tesla|SpaceX|OpenAI|ChatGPT|Claude|Anthropic|Nvidia|Intel|AMD|Samsung|Sony|Nintendo|PlayStation|Xbox|iPhone|iPad|MacBook|Windows|Android|iOS|Chrome|Safari|Firefox|Edge|Slack|Discord|Zoom|Teams|Notion|Figma|Adobe|Photoshop|Illustrator|Canva|Spotify|Uber|Lyft|Airbnb|Shopify|Stripe|PayPal|Venmo|Visa|Mastercard|AmEx|American Express|Coca Cola|Pepsi|McDonald's|Starbucks|Nike|Adidas|BMW|Mercedes|Audi|Toyota|Honda|Ford|Volkswagen|Tesla|Porsche|Ferrari|Lamborghini|Rolex|Gucci|Louis Vuitton|Chanel|Prada|Hermès|Tiffany|Cartier|Burberry|Ralph Lauren|Calvin Klein|Tommy Hilfiger|Zara|H&M|Uniqlo|IKEA|Walmart|Target|Costco|Best Buy|Home Depot|Lowe's|CVS|Walgreens|Marriott|Hilton|Hyatt|Sheraton|Four Seasons|Ritz Carlton)\b/gi,
        className: 'highlight-brand'
      },
      // Currency - Green
      {
        highlight: /\$[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|BRL|RUB|KRW|MXN|SGD|HKD|NOK|SEK|DKK|PLN|CZK|HUF|ZAR|THB|MYR|PHP|IDR|VND|TRY|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|dollars?|euros?|pounds?|yen|yuan|rupees?|francs?|krona|kronor|zloty|koruna|forint|rand|baht|ringgit|peso|pesos|rupiah|dong|lira|shekel|dirham|riyal|dinar|rial|pound)\b/gi,
        className: 'highlight-currency'
      },
      // Phone numbers - Dark Red
      {
        highlight: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b|\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
        className: 'highlight-phone'
      },
      // Time expressions - Purple
      {
        highlight: /\b(?:1[0-2]|0?[1-9]):[0-5][0-9]\s*(?:AM|PM|am|pm)\b|\b(?:2[0-3]|[01]?[0-9]):[0-5][0-9]\b|\b(?:morning|afternoon|evening|night|today|tomorrow|yesterday|tonight|dawn|dusk|noon|midnight)\b/gi,
        className: 'highlight-time'
      },
      // Tech terms - Cyan
      {
        highlight: /\b(?:API|REST|GraphQL|JSON|XML|HTML|CSS|JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Redis|Docker|Kubernetes|AWS|Azure|GCP|Git|GitHub|GitLab|CI\/CD|DevOps|Machine Learning|AI|ML|Neural Network|Deep Learning|React|Vue|Angular|Node\.js|Express|Django|Flask|Spring|Laravel|Rails|TensorFlow|PyTorch|Pandas|NumPy|Jupyter|VS Code|IntelliJ|Eclipse|Xcode|Android Studio|Firebase|Supabase|Vercel|Netlify|Heroku|DigitalOcean|Cloudflare|Twilio|SendGrid|Mailchimp)\b/gi,
        className: 'highlight-tech'
      }
    ]

    return (
      <div 
        className={cn(
          "relative w-full",
          disabled && "opacity-50 pointer-events-none"
        )}
        style={style}
      >
        <HighlightWithinTextarea
          ref={highlightRef}
          value={value}
          highlight={highlightRules}
          onChange={handleChange}
          placeholder={placeholder}
        />
        
        {/* Custom CSS for highlighting styles */}
        <style jsx global>{`
          .highlight-url {
            color: #3b82f6 !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-email {
            color: #8b5cf6 !important;
            background-color: rgba(139, 92, 246, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-date {
            color: #f59e0b !important;
            background-color: rgba(245, 158, 11, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-location {
            color: #10b981 !important;
            background-color: rgba(16, 185, 129, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-brand {
            color: #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-currency {
            color: #059669 !important;
            background-color: rgba(5, 150, 105, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-phone {
            color: #dc2626 !important;
            background-color: rgba(220, 38, 38, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-time {
            color: #7c3aed !important;
            background-color: rgba(124, 58, 237, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          .highlight-tech {
            color: #0891b2 !important;
            background-color: rgba(8, 145, 178, 0.1) !important;
            font-weight: 500;
            border-radius: 2px;
            padding: 0 1px;
          }
          
          /* Custom styles for the highlighting container to match our design */
          .hwt-container {
            font-family: inherit !important;
            font-size: inherit !important;
            line-height: inherit !important;
            width: 100% !important;
          }
          
          .hwt-input {
            font-family: inherit !important;
            font-size: inherit !important;
            line-height: inherit !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
            background: transparent !important;
            resize: none !important;
            width: 100% !important;
            min-height: 24px !important;
            max-height: 120px !important;
          }
          
          .hwt-backdrop {
            font-family: inherit !important;
            font-size: inherit !important;
            line-height: inherit !important;
          }
          
          .hwt-highlights {
            font-family: inherit !important;
            font-size: inherit !important;
            line-height: inherit !important;
          }
          
          .hwt-input::placeholder {
            color: rgb(107 114 128) !important;
          }
        `}</style>
      </div>
    )
  }
)

HighlightedChatInput.displayName = 'HighlightedChatInput' 