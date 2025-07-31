
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatProvider } from '@/contexts/chat-context'
import { FlightSearchProvider } from '@/contexts/flight-search-provider'
import { MiroProvider } from '@/contexts/miro-context'
import { ShopifyProvider } from '@/contexts/shopify-context'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <MiroProvider>
        <ShopifyProvider>
          <FlightSearchProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </FlightSearchProvider>
        </ShopifyProvider>
      </MiroProvider>
    </QueryClientProvider>
  )
} 