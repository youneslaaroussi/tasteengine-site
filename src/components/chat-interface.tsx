'use client'

import { useRef, useEffect, useCallback, memo } from 'react'
import { ChatMessage } from './chat-message'
import { ChatInput, ChatInputRef } from './chat-input'
import { StarterPrompts } from './starter-prompts'
import { useChat } from '@/hooks/use-chat'
import { useFlightSearch } from '@/hooks/use-flight-search'
import { ChatMessage as ChatMessageType } from '@/types/chat'

const INITIAL_MESSAGE: ChatMessageType = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your travel assistant. I can help you search for flights, find travel deals, and plan your trips. What can I help you with today?",
  createdAt: new Date(),
}

interface ChatInterfaceProps {
  className?: string
}

export const ChatInterface = memo(({ className }: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputRef>(null)
  
  // Flight search functionality
  const flightSearch = useFlightSearch()
  
  // Chat functionality
  const chat = useChat({
    initialMessages: [INITIAL_MESSAGE],
    onFlightSearchStart: flightSearch.startSearch,
  })

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chat.messages, scrollToBottom])

  // Focus input when loading completes
  useEffect(() => {
    if (!chat.isLoading) {
      setTimeout(() => chatInputRef.current?.focus(), 100)
    }
  }, [chat.isLoading])

  // Handle prompt clicks
  const handlePromptClick = useCallback((prompt: string) => {
    chat.setInput(prompt)
    setTimeout(() => {
      chat.handleSubmit()
    }, 100)
  }, [chat])

  // Handle form submission with flight data
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    const flightData = {
      searchId: flightSearch.searchId,
      flights: flightSearch.flights,
      pricingTokens: flightSearch.pricingTokens,
    }
    chat.handleSubmit(e, flightData)
  }, [chat, flightSearch])

  const hasUserMessages = chat.messages.some(msg => msg.role === 'user')

  return (
    <div className={`chat-container ${className || ''}`}>
      {/* Messages */}
      <div className="chat-messages custom-scrollbar">
        {chat.messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={chat.isLoading && index === chat.messages.length - 1}
          />
        ))}
        
        {/* Show flight search status */}
        {flightSearch.isSearching && (
          <div className="chat-message assistant bg-white">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">GoFlyTo</div>
                  <div className="text-gray-800">
                    Searching for flights... Found {flightSearch.flights.length} options so far.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show starter prompts only if no user messages */}
        {!hasUserMessages && !chat.isLoading && (
          <div className="pt-8">
            <StarterPrompts onPromptClick={handlePromptClick} />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        ref={chatInputRef}
        input={chat.input}
        setInput={chat.setInput}
        onSubmit={handleSubmit}
        isLoading={chat.isLoading || flightSearch.isSearching}
        onStop={chat.stop}
      />
    </div>
  )
})

ChatInterface.displayName = 'ChatInterface'