import { Element } from 'hast'

// Define highlighting patterns for different content types
export const HIGHLIGHT_PATTERNS = [
  // URLs
  {
    name: 'url',
    pattern: /https?:\/\/[^\s]+|www\.[^\s]+/gi,
    className: 'highlight-url',
    style: { color: '#3b82f6', backgroundColor: '#3b82f615', fontWeight: '500' }
  },
  
  // Email addresses
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    className: 'highlight-email',
    style: { color: '#8b5cf6', backgroundColor: '#8b5cf615', fontWeight: '500' }
  },
  
  // Dates (various formats)
  {
    name: 'date',
    pattern: /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
    className: 'highlight-date',
    style: { color: '#f59e0b', backgroundColor: '#f59e0b15', fontWeight: '500' }
  },
  
  // Locations/Countries (shortened list for performance)
  {
    name: 'location',
    pattern: /\b(?:USA|US|United States|UK|United Kingdom|Canada|France|Germany|Italy|Spain|Japan|China|India|Australia|Brazil|Mexico|Russia|South Korea|Netherlands|Sweden|Norway|Denmark|Finland|Switzerland|New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Francisco|Seattle|Boston|Miami|Atlanta|Las Vegas|Washington|Portland|Denver|Austin|Dallas|Orlando|Nashville|Detroit|Pittsburgh|Baltimore|Cleveland|Milwaukee|Minneapolis|Tampa|St\. Louis|Cincinnati|Kansas City|Sacramento|San Diego|San Antonio|San Jose|Charlotte|Jacksonville|Columbus|Indianapolis|Memphis|Louisville|Buffalo|Newark|Toledo|Madison|Raleigh|Virginia Beach|Colorado Springs|Mesa|Long Beach|Fresno|Tucson|Omaha|Oakland|Tulsa|Wichita|Arlington|Bakersfield|Aurora|Anaheim|Santa Ana|Riverside|Corpus Christi|Lexington|Stockton|Henderson|Saint Paul|Plano|Lincoln|Irvine|Chesapeake|Greensboro|Norfolk|Lubbock|Winston-Salem|Glendale|Hialeah|Garland|Irving|Scottsdale|North Las Vegas|Boise|Richmond|Spokane|Des Moines|Tacoma|Fontana|Modesto|Birmingham|Oxnard|Fayetteville|Rochester|Moreno Valley|Glendale|Huntington Beach|Salt Lake City|Grand Rapids|Amarillo|Yonkers|Aurora|Montgomery|Akron|Little Rock|Huntsville|Augusta|Columbus|Tallahassee|Shreveport|Mobile|Knoxville|Worcester|Newport News|Tempe|Eugene|Cape Coral|Springfield|Salinas|Overland Park|Rockford|Torrance|Fullerton|Bridgeport|New Haven|Hollywood|Warren|Olathe|Sterling Heights|West Valley City|Columbia|Thousand Oaks|Cedar Rapids|Santa Clara|Saint Paul|Jackson|Bellevue|Vallejo)/gi,
    className: 'highlight-location',
    style: { color: '#10b981', backgroundColor: '#10b98115', fontWeight: '500' }
  },
  
  // Brand names (tech companies and popular brands)
  {
    name: 'brand',
    pattern: /\b(?:Apple|Google|Microsoft|Amazon|Meta|Facebook|Instagram|Twitter|X|LinkedIn|TikTok|YouTube|Netflix|Tesla|SpaceX|OpenAI|ChatGPT|Claude|Anthropic|Nvidia|Intel|AMD|Samsung|Sony|Nintendo|PlayStation|Xbox|iPhone|iPad|MacBook|Windows|Android|iOS|Chrome|Safari|Firefox|Edge|Slack|Discord|Zoom|Teams|Notion|Figma|Adobe|Photoshop|Illustrator|Canva|Spotify|Uber|Lyft|Airbnb|Shopify|Stripe|PayPal|Venmo|Visa|Mastercard|AmEx|American Express|Coca Cola|Pepsi|McDonald's|Starbucks|Nike|Adidas|BMW|Mercedes|Audi|Toyota|Honda|Ford|Volkswagen|Tesla|Porsche|Ferrari|Lamborghini|Rolex|Gucci|Louis Vuitton|Chanel|Prada|Hermès|Tiffany|Cartier|Burberry|Ralph Lauren|Calvin Klein|Tommy Hilfiger|Zara|H&M|Uniqlo|IKEA|Walmart|Target|Costco|Best Buy|Home Depot|Lowe's|CVS|Walgreens|Marriott|Hilton|Hyatt|Sheraton|Four Seasons|Ritz Carlton)/gi,
    className: 'highlight-brand',
    style: { color: '#ef4444', backgroundColor: '#ef444415', fontWeight: '500' }
  },
  
  // Money/Currency
  {
    name: 'currency',
    pattern: /\$[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR|BRL|RUB|KRW|MXN|SGD|HKD|NOK|SEK|DKK|PLN|CZK|HUF|ZAR|THB|MYR|PHP|IDR|VND|TRY|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|dollars?|euros?|pounds?|yen|yuan|rupees?|francs?|krona|kronor|zloty|koruna|forint|rand|baht|ringgit|peso|pesos|rupiah|dong|lira|shekel|dirham|riyal|dinar|rial|pound)\b/gi,
    className: 'highlight-currency',
    style: { color: '#059669', backgroundColor: '#05966915', fontWeight: '500' }
  },
  
  // Phone numbers
  {
    name: 'phone',
    pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b|\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
    className: 'highlight-phone',
    style: { color: '#dc2626', backgroundColor: '#dc262615', fontWeight: '500' }
  },
  
  // Time expressions
  {
    name: 'time',
    pattern: /\b(?:1[0-2]|0?[1-9]):[0-5][0-9]\s*(?:AM|PM|am|pm)\b|\b(?:2[0-3]|[01]?[0-9]):[0-5][0-9]\b|\b(?:morning|afternoon|evening|night|today|tomorrow|yesterday|tonight|dawn|dusk|noon|midnight)\b/gi,
    className: 'highlight-time',
    style: { color: '#7c3aed', backgroundColor: '#7c3aed15', fontWeight: '500' }
  },
  
  // Programming/Tech terms
  {
    name: 'tech',
    pattern: /\b(?:API|REST|GraphQL|JSON|XML|HTML|CSS|JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Redis|Docker|Kubernetes|AWS|Azure|GCP|Git|GitHub|GitLab|CI\/CD|DevOps|Machine Learning|AI|ML|Neural Network|Deep Learning|React|Vue|Angular|Node\.js|Express|Django|Flask|Spring|Laravel|Rails|TensorFlow|PyTorch|Pandas|NumPy|Jupyter|VS Code|IntelliJ|Eclipse|Xcode|Android Studio|Firebase|Supabase|Vercel|Netlify|Heroku|DigitalOcean|Cloudflare|Twilio|SendGrid|Mailchimp)\b/gi,
    className: 'highlight-tech',
    style: { color: '#0891b2', backgroundColor: '#0891b215', fontWeight: '500' }
  }
]

// Rehype plugin to add highlighting
export const rehypeHighlightPlugin = () => {
  return (tree: any) => {
    function visit(node: any) {
      if (node.type === 'text' && node.value) {
        const parent = node.parent
        if (!parent || parent.tagName === 'span') return // Skip already processed nodes
        
        const text = node.value
        const segments: Array<{ text: string; type?: string; style?: any }> = []
        
        let lastIndex = 0
        const allMatches: Array<{ match: RegExpMatchArray; pattern: any }> = []
        
        // Find all matches
        HIGHLIGHT_PATTERNS.forEach(pattern => {
          const regex = new RegExp(pattern.pattern)
          let match
          while ((match = regex.exec(text)) !== null) {
            allMatches.push({ match, pattern })
          }
        })
        
        // Sort matches by position
        allMatches.sort((a, b) => a.match.index! - b.match.index!)
        
        // Process matches without overlaps
        let processedEnd = 0
        allMatches.forEach(({ match, pattern }) => {
          if (match.index! >= processedEnd) {
            // Add text before match
            if (match.index! > lastIndex) {
              segments.push({ text: text.slice(lastIndex, match.index!) })
            }
            
            // Add highlighted match
            segments.push({
              text: match[0],
              type: pattern.name,
              style: pattern.style
            })
            
            lastIndex = match.index! + match[0].length
            processedEnd = lastIndex
          }
        })
        
        // Add remaining text
        if (lastIndex < text.length) {
          segments.push({ text: text.slice(lastIndex) })
        }
        
        // Replace the text node with highlighted segments
        if (segments.length > 1) {
          const newChildren = segments.map((segment, index) => {
            if (segment.type) {
              return {
                type: 'element',
                tagName: 'span',
                properties: {
                  className: [`highlight-${segment.type}`],
                  style: segment.style
                },
                children: [{ type: 'text', value: segment.text }]
              }
            } else {
              return { type: 'text', value: segment.text }
            }
          })
          
          const parentIndex = parent.children.indexOf(node)
          parent.children.splice(parentIndex, 1, ...newChildren)
        }
      }
      
      if (node.children) {
        // Make a copy of children since we might modify the array
        const children = [...node.children]
        children.forEach(child => {
          child.parent = node
          visit(child)
        })
      }
    }
    
    visit(tree)
  }
} 