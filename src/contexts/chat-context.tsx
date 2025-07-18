'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage, FlightSearchData } from '@/types/chat'
import { useFlightSearchContext } from './flight-search-context'

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your travel assistant. I can help you search for flights, find travel deals, and plan your trips. What can I help you with today?",
  createdAt: new Date(),
}

interface ChatContextType {
  messages: ChatMessage[]
  input: string
  setInput: (value: string) => void
  handleSubmit: (e?: React.FormEvent, flightData?: FlightSearchData) => void
  isLoading: boolean
  stop: () => void
  reload: () => void
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const flightSearch = useFlightSearchContext()
  const chat = useChat({
    initialMessages: [INITIAL_MESSAGE],
    onFlightSearchStart: flightSearch.startSearch,
  })

  return (
    <ChatContext.Provider value={chat}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}