
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatProvider } from '@/contexts/chat-context'
import { FlightSearchProvider } from '@/contexts/flight-search-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <FlightSearchProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </FlightSearchProvider>
    </QueryClientProvider>
  )
} 