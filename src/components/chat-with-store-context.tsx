'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { aiService, type ChatMessage } from '@/lib/ai-service'
import { storeManager } from '@/lib/store-manager'
import { Loader2, Store, AlertTriangle, Send } from 'lucide-react'

interface ChatWithStoreContextProps {
  sessionId?: string
  className?: string
}

export function ChatWithStoreContext({ sessionId, className = '' }: ChatWithStoreContextProps) {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<ChatMessage[]>([])
  const [activeStore, setActiveStore] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load active store on component mount
    const store = storeManager.getActiveStore()
    setActiveStore(store)

    // Listen for store changes
    const handleStoreChange = (event: any) => {
      setActiveStore(event.detail.store)
      setError(null) // Clear any previous errors
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storeChanged', handleStoreChange)
      return () => window.removeEventListener('storeChanged', handleStoreChange)
    }
  }, [])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // Add user message to conversation
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    setConversation(prev => [...prev, userMessage])
    setMessage('')

    try {
      // Stream the AI response
      const responseChunks: string[] = []
      
      for await (const chunk of aiService.streamChat({
        message,
        conversationHistory: conversation,
        sessionId
      })) {
        if (chunk.type === 'content' && chunk.content) {
          responseChunks.push(chunk.content)
          
          // Update UI with streaming content
          setConversation(prev => {
            const newConv = [...prev]
            const lastMsg = newConv[newConv.length - 1]
            
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = responseChunks.join('')
            } else {
              newConv.push({
                role: 'assistant',
                content: responseChunks.join(''),
                timestamp: new Date().toISOString()
              })
            }
            
            return newConv
          })
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Unknown error occurred')
        }
      }

    } catch (err) {
      console.error('Chat error:', err)
      
      const formattedError = aiService.formatError(err as Error)
      setError(formattedError.message)
      
      // Add error message to conversation
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${formattedError.message}`,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getSuggestedPrompts = () => {
    return aiService.getSuggestedPrompts()
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt)
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Store indicator */}
      <div className="flex-shrink-0 p-3 border-b bg-gray-50">
        {activeStore ? (
          <div className="flex items-center gap-2 text-sm">
            <Store className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">
              Connected to: {activeStore.shopInfo?.name || activeStore.shopDomain}
            </span>
            {!activeStore.isValid && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>No store selected - Shopify tools unavailable</span>
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to your AI assistant!
            </h3>
            <p className="text-gray-600 mb-4">
              {activeStore 
                ? `I can help you manage your ${activeStore.shopInfo?.name || 'Shopify store'}`
                : 'Connect a Shopify store to unlock powerful e-commerce features'
              }
            </p>
            
            {/* Suggested prompts */}
            <div className="grid gap-2 max-w-md mx-auto">
              {getSuggestedPrompts().slice(0, 4).map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="text-left h-auto py-2 px-3"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((msg, index) => (
          <div key={`${msg.timestamp}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="text-sm font-medium mb-1">
                {msg.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div className="whitespace-pre-wrap">
                {msg.content}
              </div>
              {msg.timestamp && (
                <div className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex-shrink-0 p-3 border-t bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t">
        <div className="flex gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={activeStore 
              ? "Ask about your products, orders, customers..." 
              : "Ask me anything (connect a store for Shopify features)..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !message.trim()}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 