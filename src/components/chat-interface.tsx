'use client'

import { useRef, useEffect, useCallback, memo } from 'react'
import { ChatInput, ChatInputRef } from './chat-input'
import { StarterPrompts } from './starter-prompts'
import { useChatContext } from '@/contexts/chat-context'
import { useFlightSearch } from '@/contexts/flight-search-provider'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { ChatMessage } from './chat-message'
import { useMessageProcessor } from '@/hooks/use-message-processor'

interface ChatInterfaceProps {
  className?: string
}

export const ChatInterface = memo(({ className }: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputRef>(null)
  
  // Get state from contexts
  const campaign = useChatContext()
  const { isSearching, flights } = useFlightSearch()
  
  // Custom hook to process messages
  useMessageProcessor();

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [campaign.messages, scrollToBottom])

  // Focus input when loading completes
  useEffect(() => {
    if (!campaign.isLoading) {
      setTimeout(() => chatInputRef.current?.focus(), 100)
    }
  }, [campaign.isLoading])

  const hasUserMessages = campaign.messages.some((msg: ChatMessageType) => msg.role === 'user')

  return (
    <div className={`h-full flex flex-col bg-white ${className || ''}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {campaign.messages.map((message: ChatMessageType, index: number) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={campaign.isLoading && index === campaign.messages.length - 1}
          />
        ))}
        
        {/* Show flight search status */}
        {isSearching && (
          <div className="campaign-message assistant bg-white mb-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">TasteEngine</div>
                  <div className="text-gray-800">
                    Searching for flights... Found {flights.length} options so far.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show starter prompts only if no user messages */}
        {!hasUserMessages && !campaign.isLoading && (
          <div className="pt-8 px-3 md:px-4">
            <StarterPrompts onPromptClick={() => {
              // The input is now handled by the starter prompt itself
              // We could potentially focus the input here if needed
            }} />
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