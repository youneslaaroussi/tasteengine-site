'use client'

import { createContext, useContext, ReactNode, useMemo } from 'react'
import { useChat as useChatHook, type UseChatOptions } from '@/hooks/use-chat'
import { useAnalytics } from '@/hooks/use-analytics'
import { ChatMessage, FlightSearchData } from '@/types/chat'
import { useFlightSearchContext } from './flight-search-context'

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your travel assistant. I can help you search for flights, find travel deals, and plan your trips. What can I help you with today?",
  createdAt: new Date(),
}

type ChatContextType = ReturnType<typeof useChatHook> & {
  trackEvent: (
    action: string,
    category: string,
    label: string,
    value: number,
  ) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider = ({
  children,
}: ChatProviderProps) => {
  const flightSearch = useFlightSearchContext()
  const chat = useChatHook({ onFlightSearchStart: flightSearch.startSearch })
  const { trackEvent } = useAnalytics()

  const contextValue = useMemo(
    () => ({
      ...chat,
      trackEvent,
    }),
    [chat, trackEvent],
  )

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === null) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}