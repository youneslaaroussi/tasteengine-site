'use client'

import { ChatInterface } from '@/components/chat-interface'
import { ChatProvider } from '@/contexts/chat-context'
import { FlightSearchProvider, useFlightSearchContext } from '@/contexts/flight-search-context'

function AppWithProviders() {
  return (
    <FlightSearchProvider>
      <ChatWithFlightSearch />
    </FlightSearchProvider>
  )
}

function ChatWithFlightSearch() {
  const flightSearch = useFlightSearchContext()
  
  return (
    <ChatProvider onFlightSearchStart={flightSearch.startSearch}>
      <ChatInterface />
    </ChatProvider>
  )
}

export default function Home() {
  return <AppWithProviders />
}