'use client'

import { useCallback, useRef } from 'react'
import { ChatMessage, FlightSearchData } from '@/types/chat'
import { nanoid } from 'nanoid'
import { useAnalytics } from './use-analytics'
import { useChatStore } from '@/stores/chat-store'

export type UseChatOptions = {
  initialMessages?: ChatMessage[]
  onFlightSearchStart?: (searchId: string) => void
}

export function useChat({ initialMessages = [], onFlightSearchStart }: UseChatOptions = {}) {
  const { trackEvent } = useAnalytics()
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const {
    currentSession,
    input,
    isLoading,
    addMessage,
    updateMessage,
    setInput,
    setLoading,
    createSession,
  } = useChatStore()

  // Initialize session if needed and has initial messages
  if (!currentSession && initialMessages.length > 0) {
    createSession()
    initialMessages.forEach(msg => addMessage(msg))
  }

  const messages = currentSession?.messages || []

  const handleSubmit = useCallback(async (e?: React.FormEvent, flightData?: FlightSearchData) => {
    e?.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage: Omit<ChatMessage, 'id' | 'createdAt'> = {
      role: 'user',
      content: input.trim(),
    }

    // Add user message through store
    addMessage(userMessage)
    setInput('')
    setLoading(true)

    // Create abort controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Keep track of tool call IDs
      const toolCallIds: Record<string, string> = {}

      // Prepare conversation history
      const conversationHistory: Array<{ role: string; content: string }> = [...messages, {
        id: crypto.randomUUID(),
        role: 'user',
        content: input.trim(),
        createdAt: new Date(),
      }].map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      // Add flight data if available
      if (flightData?.flights?.length) {
        const flightDataMessage = {
          role: 'data',
          content: JSON.stringify({
            toolName: 'search_bookable_flights',
            data: {
              flights: flightData.flights,
              pricingTokens: flightData.pricingTokens || {},
            }
          })
        }
        
        // Insert before the last user message
        conversationHistory.splice(-1, 0, flightDataMessage)
      }

      const requestBody = {
        message: userMessage.content,
        conversationHistory,
      }

      // Make request to external API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agent/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`API responded with ${response.status}`)
      }

      // Create assistant message
      const assistantMessage: Omit<ChatMessage, 'id' | 'createdAt'> = {
        role: 'assistant',
        content: '',
      }

      addMessage(assistantMessage)
      
      // Get the assistant message ID after it's added
      const currentMessages = useChatStore.getState().currentSession?.messages || []
      const assistantMsg = currentMessages[currentMessages.length - 1]
      
      if (!assistantMsg) {
        throw new Error('Failed to create assistant message')
      }

      // Process streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'content_stream' && data.content) {
                // Update the assistant message content
                updateMessage(assistantMsg.id, (prevContent) => prevContent + data.content)
              } 
              
              else if (data.type === 'tool_start' && data.toolName) {
                const toolId = nanoid()
                toolCallIds[data.toolName] = toolId
                
                const toolMarkdown = `\n{% tool_start '${data.toolName}' '${toolId}' %}\n{% tool_description %}${data.toolDescription || 'Processing...'}{% end_tool_description %}\n{% endtool %}\n`
                updateMessage(assistantMsg.id, (prevContent) => prevContent + toolMarkdown)
              }
              
              else if (data.type === 'tool_complete' && data.toolName) {
                if (data.toolName === 'initiate_flight_search') {
                  const toolData = data.data
                  if (toolData) {
                    const callKey = Object.keys(toolData)[0]
                    const searchId = toolData[callKey]?.searchId

                    if (searchId && onFlightSearchStart) {
                      onFlightSearchStart(searchId)
                    }
                  }
                }

                const toolId = toolCallIds[data.toolName]
                if (!toolId) continue

                let toolMarkdown = `{% tool_complete '${data.toolName}' '${toolId}' %}\n`
                
                const bookingTools = [
                  'create_flight_itinerary',
                  'search_bookable_flights', 
                  'searchBookableFlights',
                  'initiate_flight_search',
                  'validate_booking',
                  'validateBooking',
                  'create_booking',
                  'createBooking',
                  'get_booking_status',
                  'getBookingStatus',
                  'cancel_booking',
                  'cancelBooking',
                  'create_affiliate_links',
                  'createAffiliateLinks'
                ]
                
                if (data.data && bookingTools.includes(data.toolName)) {
                  toolMarkdown += JSON.stringify(data.data, null, 2)
                }
                toolMarkdown += '\n{% endtool %}\n'
                
                updateMessage(assistantMsg.id, (prevContent) => {
                  return prevContent.replace(
                    `{% tool_start '${data.toolName}' '${toolId}' %}`, 
                    `{% tool_complete '${data.toolName}' '${toolId}' %}`
                  ) + toolMarkdown
                })
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted')
      } else {
        console.error('Chat error:', error)
        addMessage({
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
        })
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [input, messages, isLoading, onFlightSearchStart, addMessage, updateMessage, setInput, setLoading])

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const reload = useCallback(() => {
    if (messages.length === 0) return
    
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')
    if (lastUserMessage) {
      setInput(lastUserMessage.content)
      // Remove messages after the last user message
      const userMessageIndex = messages.findIndex(msg => msg.id === lastUserMessage.id)
      if (userMessageIndex !== -1) {
        // We need to update the session to remove messages after this index
        const newMessages = messages.slice(0, userMessageIndex)
        if (currentSession) {
          currentSession.messages = newMessages
        }
      }
    }
  }, [messages, setInput, currentSession])

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    reload,
    trackEvent,
  }
} 