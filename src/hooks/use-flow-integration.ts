'use client'

import { useEffect, useRef } from 'react'
import { flowManager } from '@/components/flow-view/flow-manager'
import { useChatStore } from '@/stores/campaign-store'

export function useFlowIntegration() {
  const { currentSession } = useChatStore()
  const processedMessageIdsRef = useRef<Set<string>>(new Set())
  
  // Reset when session changes
  useEffect(() => {
    if (currentSession?.id) {
      processedMessageIdsRef.current.clear()
      flowManager.clear()
      flowManager.startConversation(currentSession.id)
    }
  }, [currentSession?.id])

  // Process messages when they change
  useEffect(() => {
    if (!currentSession?.messages) return

    const messages = currentSession.messages
    
    // Process each message if not already processed
    messages.forEach((message, index) => {
      // Create unique ID using message ID + index for extra safety
      const messageKey = `${message.id}-${index}-${message.role}`
      
      // Skip if already processed
      if (processedMessageIdsRef.current.has(messageKey)) {
        return
      }

      console.log(`[FLOW] Processing new message:`, { role: message.role, index, id: message.id })

      if (message.role === 'user') {
        const timestamp = message.createdAt instanceof Date 
          ? message.createdAt.getTime() 
          : Date.now()
        
        flowManager.addUserMessage(message.content, timestamp)
        
        // Add agent reasoning
        setTimeout(() => {
          flowManager.addAgentReasoning(
            'Processing user request and planning actions...',
            ['Analyze request', 'Select tools', 'Execute', 'Respond'],
            Date.now()
          )
        }, 200)
      } 
      else if (message.role === 'assistant') {
        // Add response
        setTimeout(() => {
          const wordCount = message.content.split(' ').length
          flowManager.addFinalResponse(message.content, wordCount, Date.now())
          
          // Auto layout
          setTimeout(() => {
            flowManager.autoLayout()
          }, 100)
        }, 400)
      }

      // Mark as processed
      processedMessageIdsRef.current.add(messageKey)
    })

  }, [currentSession?.messages])

  return {
    clearFlow: () => {
      flowManager.clear()
      processedMessageIdsRef.current.clear()
    },
    autoLayout: () => {
      flowManager.autoLayout()
    }
  }
} 