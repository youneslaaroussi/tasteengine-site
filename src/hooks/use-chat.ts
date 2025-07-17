'use client'

import { useState, useCallback, useRef } from 'react'
import { ChatMessage, FlightSearchData } from '@/types/chat'

interface UseChatOptions {
  initialMessages?: ChatMessage[]
  onFlightSearchStart?: (searchId: string) => void
}

export function useChat({ initialMessages = [], onFlightSearchStart }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(async (e?: React.FormEvent, flightData?: FlightSearchData) => {
    e?.preventDefault()
    
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }

    // Optimistically add user message
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create abort controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Prepare conversation history
      const conversationHistory: Array<{ role: string; content: string }> = [...messages, userMessage].map(msg => ({
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
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

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
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ))
              } else if (data.type === 'tool_start' && data.toolName === 'initiate_flight_search') {
                // Extract search ID and trigger flight search
                const searchId = data.searchId
                if (searchId && onFlightSearchStart) {
                  onFlightSearchStart(searchId)
                }
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
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          createdAt: new Date(),
        }])
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [input, messages, isLoading, onFlightSearchStart])

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
      setMessages(prev => prev.slice(0, prev.findIndex(msg => msg.id === lastUserMessage.id)))
    }
  }, [messages])

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    reload,
    setMessages,
  }
}