import { storeManager } from './store-manager'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

interface ChatOptions {
  sessionId?: string
  conversationHistory?: ChatMessage[]
  memories?: any[]
  userIp?: string
  images?: string[]
  stream?: boolean
}

interface ChatRequestBody {
  message: string
  sessionId?: string
  conversationHistory?: ChatMessage[]
  memories?: any[]
  userIp?: string
  images?: string[]
  shopDomain?: string
  accessToken?: string
}

interface StreamChunk {
  type: 'content' | 'tool_call' | 'error' | 'done'
  content?: string
  toolCall?: any
  error?: string
}

export class AIService {
  private baseUrl: string

  constructor(baseUrl: string = '/api/ai') {
    this.baseUrl = baseUrl
  }

  // Send campaign message with store context
  async sendMessage(message: string, options: ChatOptions = {}): Promise<any> {
    const credentials = storeManager.getActiveStoreCredentials()

    const requestBody: ChatRequestBody = {
      message,
      sessionId: options.sessionId,
      conversationHistory: options.conversationHistory || [],
      memories: options.memories || [],
      userIp: options.userIp,
      images: options.images,
      // Include Shopify credentials if available
      ...(credentials && {
        shopDomain: credentials.shopDomain,
        accessToken: credentials.accessToken
      })
    }

    if (options.stream) {
      return this.streamChat(requestBody)
    } else {
      return this.regularChat(requestBody)
    }
  }

  // Streaming campaign
  async *streamChat(requestBody: ChatRequestBody): AsyncGenerator<StreamChunk, void, unknown> {
    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Campaign request failed: ${response.statusText} - ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              yield data as StreamChunk
            } catch (e) {
              // Skip invalid JSON
              console.warn('Invalid JSON in stream:', line)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // Regular campaign
  async regularChat(requestBody: ChatRequestBody): Promise<any> {
    const response = await fetch(`${this.baseUrl}/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Campaign request failed: ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  // Check if store context is available
  hasStoreContext(): boolean {
    return storeManager.getActiveStoreCredentials() !== null
  }

  // Get current store info for display
  getCurrentStoreInfo() {
    return storeManager.getActiveStore()
  }

  // Send message with explicit store credentials (for testing)
  async sendMessageWithStore(
    message: string, 
    shopDomain: string, 
    accessToken: string, 
    options: ChatOptions = {}
  ): Promise<any> {
    const requestBody: ChatRequestBody = {
      message,
      sessionId: options.sessionId,
      conversationHistory: options.conversationHistory || [],
      memories: options.memories || [],
      userIp: options.userIp,
      images: options.images,
      shopDomain,
      accessToken
    }

    if (options.stream) {
      return this.streamChat(requestBody)
    } else {
      return this.regularChat(requestBody)
    }
  }

  // Test connection with current store
  async testConnection(): Promise<{ success: boolean, error?: string, storeInfo?: any }> {
    const credentials = storeManager.getActiveStoreCredentials()
    
    if (!credentials) {
      return { 
        success: false, 
        error: 'No store selected. Please connect to a Shopify store first.' 
      }
    }

    try {
      const response = await this.sendMessage('Test connection - what store am I connected to?', {
        stream: false
      })

      return {
        success: true,
        storeInfo: {
          shopDomain: credentials.shopDomain,
          response: response
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get suggested prompts based on store context
  getSuggestedPrompts(): string[] {
    if (!this.hasStoreContext()) {
      return [
        "Hello! How can I help you today?",
        "Tell me about your business",
        "What services do you offer?",
        "Help me plan my day"
      ]
    }

    // Store-specific prompts
    return [
      "Show me my top 5 products",
      "What are my best-selling items this month?",
      "Create a new product for me",
      "Show me my recent orders",
      "Help me with inventory management",
      "Analyze my store performance",
      "Create a marketing campaign",
      "Show me my customer data"
    ]
  }

  // Format error messages for UI
  formatError(error: Error): { message: string, action?: string, type: string } {
    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes('no store') || errorMessage.includes('not connected')) {
      return {
        type: 'NO_STORE',
        message: 'Please select a Shopify store to use this feature.',
        action: 'SELECT_STORE'
      }
    }

    if (errorMessage.includes('access token') || errorMessage.includes('unauthorized')) {
      return {
        type: 'INVALID_TOKEN',
        message: 'Your store access has expired. Please reconnect.',
        action: 'REAUTH_STORE'
      }
    }

    if (errorMessage.includes('permissions') || errorMessage.includes('scope')) {
      return {
        type: 'INSUFFICIENT_PERMISSIONS',
        message: 'Your app needs additional permissions for this action.',
        action: 'UPGRADE_PERMISSIONS'
      }
    }

    if (errorMessage.includes('rate limit')) {
      return {
        type: 'RATE_LIMIT',
        message: 'Too many requests. Please wait a moment and try again.',
        action: 'RETRY_LATER'
      }
    }

    return {
      type: 'UNKNOWN',
      message: `Something went wrong: ${error.message}`,
      action: 'RETRY'
    }
  }
}

// Create singleton instance
export const aiService = new AIService()

// Export types
export type { ChatMessage, ChatOptions, StreamChunk } 