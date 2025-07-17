# Architecture Documentation

## Overview

GoFlyTo is built with a clean, minimal architecture that prioritizes performance, maintainability, and mobile experience. The app follows React and Next.js best practices while minimizing state and effects.

## Design Principles

### 1. Minimal State Management
- **Custom Hooks**: Business logic encapsulated in focused hooks
- **No Global State**: Avoiding complex state management libraries
- **Local State**: State kept as close to usage as possible
- **Immutable Updates**: Pure functions for state changes

### 2. Component Architecture
```
┌─────────────────┐
│   App (page)    │
│                 │
│ ┌─────────────┐ │
│ │ChatInterface│ │
│ │             │ │
│ │ ┌─────────┐ │ │
│ │ │Messages │ │ │
│ │ └─────────┘ │ │
│ │ ┌─────────┐ │ │
│ │ │  Input  │ │ │
│ │ └─────────┘ │ │
│ └─────────────┘ │
└─────────────────┘
```

### 3. Data Flow
```
User Input → Chat Hook → External API → Streaming Response → UI Update
                    ↓
            Flight Search Hook → Progressive Polling → UI Update
```

## Component Breakdown

### ChatInterface (Main Container)
**Responsibility**: Orchestrates chat and flight search
**State**: None (delegated to hooks)
**Effects**: Minimal (auto-scroll, focus management)

```typescript
const ChatInterface = () => {
  const chat = useChat({ onFlightSearchStart: flightSearch.startSearch })
  const flightSearch = useFlightSearch()
  
  // Minimal effects for UX
  useEffect(() => scrollToBottom(), [chat.messages])
  useEffect(() => focusInput(), [chat.isLoading])
  
  // Clean event handlers
  const handleSubmit = useCallback((e) => {
    chat.handleSubmit(e, flightData)
  }, [chat, flightData])
}
```

### ChatInput (Input Component)
**Responsibility**: User input with auto-resize and mobile optimization
**State**: Local UI state only (rows, focus)
**Features**: Auto-resize, keyboard shortcuts, mobile-friendly

```typescript
const ChatInput = forwardRef(({ input, setInput, onSubmit, isLoading }) => {
  const [rows, setRows] = useState(1)
  
  // Auto-resize logic
  const adjustHeight = useCallback(() => {
    // Pure function for height calculation
  }, [])
  
  // Clean event handlers
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit])
})
```

### ChatMessage (Display Component)
**Responsibility**: Render individual messages with markdown
**State**: None (pure component)
**Features**: Markdown rendering, streaming indicator, responsive design

```typescript
const ChatMessage = memo(({ message, isStreaming }) => {
  // Pure rendering logic
  return (
    <div className={cn("chat-message", isUser ? "user" : "assistant")}>
      <MessageContent content={message.content} isStreaming={isStreaming} />
    </div>
  )
})
```

## Hook Architecture

### useChat Hook
**Purpose**: Manages chat state and API communication
**State**: messages, input, isLoading
**Side Effects**: API calls, streaming response handling

```typescript
export function useChat({ initialMessages, onFlightSearchStart }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = useCallback(async (e, flightData) => {
    // Optimistic update
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Stream processing
      const response = await fetch(API_ENDPOINT, { /* config */ })
      // Handle streaming response
    } finally {
      setIsLoading(false)
    }
  }, [/* dependencies */])
  
  return { messages, input, setInput, handleSubmit, isLoading, stop }
}
```

### useFlightSearch Hook
**Purpose**: Manages flight search polling
**State**: searchId, flights, isSearching, error
**Side Effects**: Progressive polling

```typescript
export function useFlightSearch() {
  const [flights, setFlights] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  const startSearch = useCallback((searchId) => {
    setIsSearching(true)
    
    const pollForResults = async () => {
      // Polling logic with exponential backoff
      // Merge results to avoid duplicates
      // Continue until complete
    }
    
    pollForResults()
  }, [])
  
  return { flights, isSearching, startSearch, resetSearch }
}
```

## API Integration

### External API Communication
```typescript
// Chat API
POST /agent/chat/stream
{
  "message": "user input",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

// Response: Server-Sent Events
data: {"type": "content_stream", "content": "text chunk"}
data: {"type": "tool_start", "toolName": "initiate_flight_search"}
```

```typescript
// Flight Search API
GET /booking/search/{searchId}/results
{
  "searchId": "uuid",
  "status": { /* search status */ },
  "newFlights": [/* flight objects */],
  "pricingTokens": { /* pricing data */ },
  "hasMoreResults": true
}
```

## Mobile Optimization Strategy

### Touch-First Design
- **44px minimum touch targets**
- **Smooth scrolling** with momentum
- **Auto-focus management** for better UX
- **Responsive typography** scaling

### Performance Optimizations
```typescript
// Component memoization
const ChatMessage = memo(({ message, isStreaming }) => {
  // Only re-render when props change
})

// Callback stability
const handleSubmit = useCallback((e) => {
  // Stable reference prevents child re-renders
}, [dependencies])

// Effect optimization
useEffect(() => {
  // Minimal, focused effects
  scrollToBottom()
}, [messages]) // Only when messages change
```

### CSS Architecture
```css
/* Mobile-first responsive design */
.chat-message {
  @apply px-3 py-4; /* Mobile default */
}

@media (min-width: 768px) {
  .chat-message {
    @apply px-4 py-6; /* Desktop enhancement */
  }
}

/* Custom scrollbar for better UX */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
```

## Error Handling Strategy

### API Error Handling
```typescript
try {
  const response = await fetch(API_ENDPOINT)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  // Process response
} catch (error) {
  if (error.name === 'AbortError') {
    // User cancelled - no error message
    return
  }
  
  // Show user-friendly error
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: "I'm sorry, I encountered an error. Please try again."
  }])
}
```

### Stream Error Recovery
- **Graceful degradation** when streaming fails
- **Automatic retry** with exponential backoff
- **User feedback** without technical details

## Testing Strategy

### Component Testing
```typescript
// Pure component testing
const message = { role: 'user', content: 'Hello' }
render(<ChatMessage message={message} />)
expect(screen.getByText('Hello')).toBeInTheDocument()
```

### Hook Testing
```typescript
// Hook behavior testing
const { result } = renderHook(() => useChat())
act(() => {
  result.current.setInput('test message')
  result.current.handleSubmit()
})
expect(result.current.messages).toHaveLength(2)
```

### Integration Testing
- **API mocking** for reliable tests
- **Mobile simulation** for responsive testing
- **Accessibility testing** for inclusive design

## Security Considerations

### Environment Variables
```typescript
// Only expose necessary variables to client
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
// Private keys stay server-side
```

### Input Sanitization
```typescript
// Markdown rendering with security
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // Safe component overrides
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }}
>
  {content}
</ReactMarkdown>
```

## Deployment Architecture

### Build Optimization
```typescript
// Next.js configuration
const nextConfig = {
  experimental: {
    turbo: {
      // Optimized build pipeline
    }
  }
}
```

### Static Generation
- **Static pages** where possible
- **Dynamic imports** for code splitting
- **Image optimization** with Next.js
- **Bundle analysis** for size monitoring

## Monitoring and Analytics

### Performance Monitoring
- **Core Web Vitals** tracking
- **User interaction** analytics
- **API response times** monitoring
- **Error rate** tracking

### User Experience Metrics
- **Chat completion rates**
- **Flight search success rates**
- **Mobile vs desktop usage**
- **User flow analytics**