'use client'

import { useRef, useEffect, useCallback, memo } from 'react'
import { ChatInput, ChatInputRef } from './chat-input'
import { StarterPrompts } from './starter-prompts'
import { useChatContext } from '@/contexts/chat-context'
import { useFlightSearchState, useFlightSearchData } from '@/contexts/flight-search-provider'
import { usePrevious } from '@/hooks/use-previous'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { ChatMessage } from './chat-message'

interface ChatInterfaceProps {
  className?: string
}

export const ChatInterface = memo(({ className }: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputRef>(null)
  
  // Get state from contexts
  const chat = useChatContext()
  const { searchId, isSearching } = useFlightSearchState()
  const { flights } = useFlightSearchData()
  const wasSearching = usePrevious(isSearching)

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

  // Effect to add flight results to chat history
  useEffect(() => {
    if (wasSearching && !isSearching && flights.length > 0) {
      const flightMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'data',
        content: `I found ${flights.length} flights for you.`,
        createdAt: new Date(),
        flights: flights,
        searchId: searchId || undefined,
      };
      chat.setMessages(prev => [...prev, flightMessage]);
    }
  }, [wasSearching, isSearching, flights, searchId, chat.setMessages]);


  const hasUserMessages = chat.messages.some(msg => msg.role === 'user')

  return (
    <div className={`h-full flex flex-col bg-white ${className || ''}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chat.messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={chat.isLoading && index === chat.messages.length - 1}
          />
        ))}
        
        {/* Show flight search status */}
        {isSearching && (
          <div className="chat-message assistant bg-white mb-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">GoFlyTo</div>
                  <div className="text-gray-800">
                    Searching for flights... Found {flights.length} options so far.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show starter prompts only if no user messages */}
        {!hasUserMessages && !chat.isLoading && (
          <div className="pt-8 px-3 md:px-4">
            <StarterPrompts onPromptClick={() => {}} />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput ref={chatInputRef} />
    </div>
  )
})

ChatInterface.displayName = 'ChatInterface'