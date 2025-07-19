'use client'

import { useCallback, useRef, useEffect } from 'react'
import { ChatMessage, FlightSearchData } from '@/types/chat'
import { useAnalytics } from './use-analytics'
import { useChatStore } from '@/stores/chat-store'
import { getChatWorker } from '@/workers/chat.worker.factory'
import * as Comlink from 'comlink'
import { useNotifications } from './use-notifications'
import { nanoid } from 'nanoid'

export type UseChatOptions = {
  initialMessages?: ChatMessage[]
  onFlightSearchStart?: (searchId: string) => void
}

export function useChat({
  initialMessages = [],
  onFlightSearchStart,
}: UseChatOptions = {}) {
  const { trackEvent } = useAnalytics()
  const abortControllerRef = useRef<AbortController | null>(null)
  const { permission, requestPermission, showNotification } = useNotifications()
  
  console.log('[CHAT] useChat initialized, notification permission:', permission)

  const {
    currentSession,
    isLoading,
    addMessage,
    updateMessage,
    setLoading,
    createSession,
  } = useChatStore()

  if (!currentSession && initialMessages.length > 0) {
    createSession()
    initialMessages.forEach(msg => addMessage(msg))
  }

  const messages = currentSession?.messages || []
  const assistantMsgIdRef = useRef<string | null>(null)
  const toolCallIdsRef = useRef<Record<string, string>>({})
  const toolCallContentRef = useRef<string>('')

  const onUpdateRef = useRef((update: string) => {
    console.log('[FRONTEND] onUpdate called with content length:', update.length);
    console.log('[FRONTEND] Content preview:', update.substring(0, 100) + '...');
    console.log('[FRONTEND] Content ends with:', update.substring(update.length - 50));
    
    const assistantMsgId = assistantMsgIdRef.current;
    console.log('[FRONTEND] Assistant message ID:', assistantMsgId);
    
    if (assistantMsgId) {
      console.log('[FRONTEND] Calling updateMessage with content length:', update.length);
      // CRITICAL FIX: Preserve tool call content when updating with streamed content
      useChatStore.getState().updateMessage(assistantMsgId, () => {
        console.log('[FRONTEND] UpdateMessage updater function called, returning content length:', update.length);
        // Combine tool calls with streamed content
        const combinedContent = toolCallContentRef.current + update;
        console.log('[FRONTEND] Combined content length:', combinedContent.length);
        return combinedContent;
      });
      
      // Let's also check what's actually stored
      setTimeout(() => {
        const currentMessages = useChatStore.getState().currentSession?.messages || [];
        const storedMessage = currentMessages.find(m => m.id === assistantMsgId);
        if (storedMessage) {
          console.log('[FRONTEND] Stored message content length:', storedMessage.content.length);
          console.log('[FRONTEND] Stored message ends with:', storedMessage.content.substring(storedMessage.content.length - 50));
        }
      }, 0);
    }
  });

  const onToolCallRef = useRef((toolCall: any) => {
    const assistantMsgId = assistantMsgIdRef.current;
    if (!assistantMsgId) return;

    if (toolCall.type === 'tool_start') {
      const toolId = nanoid();
      toolCallIdsRef.current[toolCall.toolName] = toolId;
      const toolMarkdown = `\n{% tool_start '${toolCall.toolName}' '${toolId}' %}\n{% tool_description %}${
        toolCall.toolDescription || 'Processing...'
      }{% end_tool_description %}\n{% endtool %}\n`;
      
      // Store tool call content in ref so it persists during streaming
      toolCallContentRef.current += toolMarkdown;
      
      useChatStore.getState().updateMessage(assistantMsgId, content => content + toolMarkdown);
    } else if (toolCall.type === 'tool_complete') {
      if (toolCall.toolName === 'initiate_flight_search') {
        const toolData = toolCall.data;
        if (toolData) {
          const callKey = Object.keys(toolData)[0];
          const searchId = toolData[callKey]?.searchId;
          if (searchId && onFlightSearchStart) {
            onFlightSearchStart(searchId);
          }
        }
      }

      const toolId = toolCallIdsRef.current[toolCall.toolName];
      if (!toolId) return;

      // Create complete tool markdown
      let completeToolMarkdown = `{% tool_complete '${toolCall.toolName}' '${toolId}' %}\n{% tool_description %}${
        toolCall.toolDescription || 'Processing...'
      }{% end_tool_description %}\n`;
      
      if (toolCall.data) {
        completeToolMarkdown += JSON.stringify(toolCall.data, null, 2) + '\n';
      }
      completeToolMarkdown += '{% endtool %}\n';

      // Update the tool call content reference by replacing the start tag with complete
      const startPattern = `{% tool_start '${toolCall.toolName}' '${toolId}' %}\n{% tool_description %}${
        toolCall.toolDescription || 'Processing...'
      }{% end_tool_description %}\n{% endtool %}\n`;
      
      toolCallContentRef.current = toolCallContentRef.current.replace(startPattern, completeToolMarkdown);

      // Update the actual message
      useChatStore.getState().updateMessage(assistantMsgId, content => {
        return content.replace(startPattern, completeToolMarkdown);
      });
    }
  });

  // Update the current functions and create new proxies
  useEffect(() => {
    onUpdateRef.current = (update: string) => {
      console.log('[FRONTEND] onUpdate called with content length:', update.length);
      console.log('[FRONTEND] Content preview:', update.substring(0, 100) + '...');
      console.log('[FRONTEND] Content ends with:', update.substring(update.length - 50));
      
      const assistantMsgId = assistantMsgIdRef.current;
      console.log('[FRONTEND] Assistant message ID:', assistantMsgId);
      
      if (assistantMsgId) {
        console.log('[FRONTEND] Calling updateMessage with content length:', update.length);
        // CRITICAL FIX: Preserve tool call content when updating with streamed content
        useChatStore.getState().updateMessage(assistantMsgId, () => {
          console.log('[FRONTEND] UpdateMessage updater function called, returning content length:', update.length);
          // Combine tool calls with streamed content
          const combinedContent = toolCallContentRef.current + update;
          console.log('[FRONTEND] Combined content length:', combinedContent.length);
          return combinedContent;
        });
        
        // Let's also check what's actually stored
        setTimeout(() => {
          const currentMessages = useChatStore.getState().currentSession?.messages || [];
          const storedMessage = currentMessages.find(m => m.id === assistantMsgId);
          if (storedMessage) {
            console.log('[FRONTEND] Stored message content length:', storedMessage.content.length);
            console.log('[FRONTEND] Stored message ends with:', storedMessage.content.substring(storedMessage.content.length - 50));
          }
        }, 0);
      }
    };


  }, [onFlightSearchStart]);

  const submitMessage = useCallback(
    async (message: string, flightData?: FlightSearchData) => {
      console.log('[SUBMIT] submitMessage called with:', message);
      
      if (isLoading) {
        console.log('[SUBMIT] Already loading, returning');
        return;
      }

      // Clear any previous assistant message reference and tool call content
      assistantMsgIdRef.current = null;
      toolCallIdsRef.current = {};
      toolCallContentRef.current = '';

      console.log('[SUBMIT] Adding user message');
      addMessage({
        role: 'user',
        content: message,
      })
      setLoading(true)

      try {
        console.log('[SUBMIT] Getting chat worker');
        const worker = getChatWorker()
        if (!worker) {
          console.error('[SUBMIT] Chat worker not available');
          throw new Error('Chat worker not available')
        }
        console.log('[SUBMIT] Worker obtained:', worker);

        const assistantMessage: Omit<ChatMessage, 'id' | 'createdAt'> = {
          role: 'assistant',
          content: '',
        }
        console.log('[SUBMIT] Adding assistant message');
        const assistantMsgId = addMessage(assistantMessage)
        assistantMsgIdRef.current = assistantMsgId
        console.log('[SUBMIT] Assistant message ID:', assistantMsgId);

        if (!assistantMsgId) {
          console.error('[SUBMIT] Failed to create assistant message');
          throw new Error('Failed to create assistant message')
        }
        
        const currentMessages = useChatStore.getState().currentSession?.messages ?? []
        console.log('[SUBMIT] Current messages count:', currentMessages.length);

        // Create fresh Comlink proxies for this call
        const proxiedOnUpdate = Comlink.proxy(onUpdateRef.current);
        const proxiedOnToolCall = Comlink.proxy(onToolCallRef.current);

        console.log('[SUBMIT] Calling worker.sendMessage with flight data:', flightData);
        await worker.sendMessage(
          message,
          currentMessages,
          flightData,
          proxiedOnUpdate,
          proxiedOnToolCall
        )
        console.log('[SUBMIT] Worker.sendMessage completed');

        if (document.visibilityState === 'hidden') {
          await showNotification('New message from GoFlyTo', {
            body: 'Your chat response is ready.',
            icon: '/android-chrome-192x192.png',
          })
        }
      } catch (error) {
        console.error('[SUBMIT] Chat error:', error)
        addMessage({
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again. Error: " + error,
        })
      } finally {
        console.log('[SUBMIT] Setting loading to false');
        setLoading(false)
        abortControllerRef.current = null
        // Don't clear assistantMsgIdRef here - worker may still call onUpdate
        // assistantMsgIdRef.current = null
        // toolCallIdsRef.current = {} // Cleared at start of new message
      }
    },
    [
      isLoading,
      addMessage,
      setLoading,
      showNotification,
    ]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent | undefined, message: string, flightData?: FlightSearchData) => {
      e?.preventDefault()

      console.log('[CHAT] handleSubmit called, current notification permission:', permission)

      // Always request notification permission on first interaction, regardless of current state
      const notificationRequestedKey = 'goflyto-notification-requested'
      const hasRequestedNotification = sessionStorage.getItem(notificationRequestedKey)
      
      if (!hasRequestedNotification) {
        console.log('[CHAT] First interaction - forcing notification permission request, current state:', permission)
        const result = await requestPermission()
        console.log('[CHAT] Permission request result:', result)
        sessionStorage.setItem(notificationRequestedKey, 'true')
      } else {
        console.log('[CHAT] Notification permission already requested in this session')
      }

      if (!message || isLoading) return
      
      await submitMessage(message, flightData)
    },
    [
      isLoading,
      permission,
      requestPermission,
      submitMessage,
    ]
  )
  
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const reload = useCallback(() => {
    if (messages.length === 0) return

    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')
    if (lastUserMessage) {
      // setInput(lastUserMessage.content) // This needs to be handled differently now
      const userMessageIndex = messages.findIndex(
        msg => msg.id === lastUserMessage.id
      )
      if (userMessageIndex !== -1) {
        const newMessages = messages.slice(0, userMessageIndex)
        if (currentSession) {
          currentSession.messages = newMessages
        }
      }
    }
  }, [messages, currentSession])

  return {
    messages,
    handleSubmit,
    submitMessage,
    isLoading,
    stop,
    reload,
  }
} 