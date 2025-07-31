'use client'

import { useCallback, useRef, useEffect } from 'react'
import { ChatMessage, FlightSearchData } from '@/types/chat'
import { useAnalytics } from './use-analytics'
import { useChatStore } from '@/stores/chat-store'
import { getChatWorker } from '@/workers/chat.worker.factory'
import * as Comlink from 'comlink'
import { useNotifications } from './use-notifications'
import { updatePanelData } from '@/lib/panel-context'
import { nanoid } from 'nanoid'
import { formatPanelContextForAgent } from '@/lib/panel-context'
import { ZCOOL_KuaiLe } from 'next/font/google'
import { storeManager } from '@/lib/store-manager'

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
  // Track single message content that integrates text and tool calls inline
  const messageContentRef = useRef<string>('')
  // Track the last text content we've seen to calculate deltas
  const lastTextContentRef = useRef<string>('')

  const updateFullMessage = useCallback(() => {
    const assistantMsgId = assistantMsgIdRef.current
    if (!assistantMsgId) return
    
    const fullContent = messageContentRef.current
    
    useChatStore.getState().updateMessage(assistantMsgId, () => fullContent)
  }, [])

  const onUpdateRef = useRef((update: string) => {
    console.log('[FRONTEND] onUpdate called with content length:', update.length);
    
    const assistantMsgId = assistantMsgIdRef.current;
    if (!assistantMsgId) return
    
    // Calculate only the NEW text content (delta from last update)
    const lastText = lastTextContentRef.current;
    const newTextPortion = update.startsWith(lastText) ? update.slice(lastText.length) : update;
    lastTextContentRef.current = update;
    
    // Append only the new text portion to current content
    messageContentRef.current += newTextPortion;
    updateFullMessage()
  });

  const onToolCallRef = useRef((toolCall: any) => {
    const assistantMsgId = assistantMsgIdRef.current;
    if (!assistantMsgId) return;

    console.log('[CHAT] Tool call received:', toolCall.type, toolCall.toolName, 'ID:', toolCall.id);

    if (toolCall.type === 'tool_start') {
      const toolId = toolCall.id || nanoid();
      const toolKey = `${toolCall.toolName}_${toolId}`;
      toolCallIdsRef.current[toolKey] = toolId;
      const toolMarkdown = `\n{% tool_start '${toolCall.toolName}' '${toolId}' %}\n{% tool_description %}${
        toolCall.toolDescription || toolCall.description || 'Processing...'
      }{% end_tool_description %}\n{% endtool %}\n`;
      
      console.log('[CHAT] Adding tool start markdown for:', toolCall.toolName, 'with ID:', toolId);
      
      // Insert tool call at the current end of content
      messageContentRef.current += toolMarkdown
      updateFullMessage()
      
        } else if (toolCall.type === 'tool_complete') {
      console.log('[CHAT] INITIAL ENTERED TOOL_COMPLETE BRANCH');
      console.log('[CHAT] Tool complete for:', toolCall.toolName, 'with data:', toolCall.data);
      
      // Handle update_panel FIRST before toolId check
      console.log('[MIRO_DEBUG] Checking toolCall.toolName:', toolCall.toolName, 'equals update_panel?', toolCall.toolName === 'update_panel');
      if (toolCall.toolName === 'update_panel') {
        console.log('[MIRO_DEBUG] Handling update_panel in main thread:', toolCall.data);
        try {
          const result = toolCall.data;
          console.log('[MIRO_DEBUG] Raw tool result:', result);
          
          if (result && result.panelType) {
            // Extract panel data (everything except metadata)
            const { panelType, success, message, action, timestamp, ...panelData } = result;
            
            console.log('[MIRO_DEBUG] Extracted panelType:', panelType);
            console.log('[MIRO_DEBUG] Extracted panelData:', panelData);
            console.log('[MIRO_DEBUG] Current session ID:', useChatStore.getState().currentSession?.id);
            console.log('[MIRO_DEBUG] Calling updatePanelData with:', { panelType, panelData });
            const updateResult = updatePanelData(panelType, panelData, useChatStore.getState().currentSession?.id);
            console.log('[MIRO_DEBUG] Panel update result:', updateResult);
          } else {
            console.log('[MIRO_DEBUG] No result or panelType in tool data');
          }
        } catch (error) {
          console.error('[MIRO_DEBUG] Error handling update_panel:', error);
        }
      }

      // Handle Qloo tool results
      const qlooTools = [
        'search_entities', 'get_entities_by_ids', 'search_tags', 'get_tag_types',
        'find_audiences', 'get_audience_types', 'get_insights', 'get_insights_deep_dive',
        'compare_insights', 'analyze_entities', 'get_trending', 'explain_recommendation',
        'geocode_location'
      ];
      
      if (qlooTools.includes(toolCall.toolName)) {
        console.log('[QLOO_DEBUG] Handling Qloo tool result:', toolCall.toolName, toolCall.data);
        try {
          const qlooResult = {
            toolName: toolCall.toolName,
            timestamp: Date.now(),
            success: toolCall.data?.success,
            duration: toolCall.data?.duration,
            ...toolCall.data
          };
          
          // Add to Qloo panel via global function
          if (typeof window !== 'undefined' && (window as any).addQlooResult) {
            (window as any).addQlooResult(qlooResult);
            console.log('[QLOO_DEBUG] Added result to Qloo panel');
          } else {
            console.log('[QLOO_DEBUG] addQlooResult function not available yet');
          }
        } catch (error) {
          console.error('[QLOO_DEBUG] Error handling Qloo tool result:', error);
        }
      }
      
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

      const toolId = toolCall.id || Object.values(toolCallIdsRef.current).find(id => 
        messageContentRef.current.includes(`{% tool_start '${toolCall.toolName}' '${id}' %}`)
      );
      
      if (!toolId) {
        console.error('[CHAT] No tool ID found for:', toolCall.toolName, 'Available IDs:', toolCallIdsRef.current);
        return;
      }

      console.log('[CHAT] Completing tool:', toolCall.toolName, 'with ID:', toolId);

      // Create complete tool markdown
      let completeToolMarkdown = `{% tool_complete '${toolCall.toolName}' '${toolId}' %}\n{% tool_description %}${
        toolCall.toolDescription || toolCall.description || 'Completed'
      }{% end_tool_description %}\n`;
      
      if (toolCall.data) {
        completeToolMarkdown += (typeof toolCall.data === 'string' ? toolCall.data : JSON.stringify(toolCall.data, null, 2)) + '\n';
      }
      completeToolMarkdown += '{% endtool %}\n';

      // Use regex to find and replace the tool call by ID instead of exact pattern matching
      const toolStartRegex = new RegExp(`{% tool_start '${toolCall.toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}' '${toolId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}' %}[\\s\\S]*?{% endtool %}`, 'g');
      
      const oldContent = messageContentRef.current;
      messageContentRef.current = messageContentRef.current.replace(toolStartRegex, completeToolMarkdown);
      
      if (oldContent === messageContentRef.current) {
        console.error('[CHAT] Tool replacement failed for:', toolCall.toolName, toolId);
        console.log('[CHAT] Looking for pattern in content');
      } else {
        console.log('[CHAT] Successfully replaced tool:', toolCall.toolName);
      }
      
      updateFullMessage()
    }
  });

  // Update the current functions and create new proxies
  useEffect(() => {
    onUpdateRef.current = (update: string) => {
      console.log('[FRONTEND] onUpdate called with content length:', update.length);
      
      const assistantMsgId = assistantMsgIdRef.current;
      if (!assistantMsgId) return
      
      // Calculate only the NEW text content (delta from last update)
      const lastText = lastTextContentRef.current;
      const newTextPortion = update.startsWith(lastText) ? update.slice(lastText.length) : update;
      lastTextContentRef.current = update;
      
      // Append only the new text portion to current content
      messageContentRef.current += newTextPortion;
      updateFullMessage()
    };

    onToolCallRef.current = (toolCall: any) => {
      const assistantMsgId = assistantMsgIdRef.current;
      if (!assistantMsgId) {
        console.log('[CHAT] NO ASSISTANT MSG ID, RETURNING');
        return;
      }

      console.log('[CHAT] Tool call received:', toolCall.type, toolCall.toolName, 'ID:', toolCall.id);
      console.log('[CHAT] FULL TOOL CALL DEBUG:', toolCall);
      console.log('[CHAT] About to check tool_start condition');

      if (toolCall.type === 'tool_start') {
        console.log('[CHAT] ENTERED TOOL_START BRANCH');
        const toolId = toolCall.id || nanoid();
        const toolKey = `${toolCall.toolName}_${toolId}`;
        toolCallIdsRef.current[toolKey] = toolId;
        const toolMarkdown = `\n{% tool_start '${toolCall.toolName}' '${toolId}' %}\n{% tool_description %}${
          toolCall.toolDescription || toolCall.description || 'Processing...'
        }{% end_tool_description %}\n{% endtool %}\n`;
        
        console.log('[CHAT] Adding tool start markdown for:', toolCall.toolName, 'with ID:', toolId);
        
        // Insert tool call at the current end of content
        messageContentRef.current += toolMarkdown
        updateFullMessage()
        
      } else if (toolCall.type === 'tool_complete') {
        console.log('[CHAT] Tool complete for:', toolCall.toolName, 'with data:', toolCall.data);
        
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

        // Handle Qloo tool calls - send results to Qloo panel
        if (toolCall.toolName && (
          toolCall.toolName.includes('search_entities') ||
          toolCall.toolName.includes('get_insights') ||
          toolCall.toolName.includes('get_audiences') ||
          toolCall.toolName.includes('get_tags') ||
          toolCall.toolName.includes('get_trending') ||
          toolCall.toolName.includes('compare_insights') ||
          toolCall.toolName.includes('deep_dive')
        )) {
          console.log('[QLOO_DEBUG] Qloo tool call detected:', toolCall.toolName, toolCall.data);
          
          // Send to Qloo panel via global function
          if (typeof window !== 'undefined' && (window as any).addQlooResult) {
            const qlooResult = {
              id: `qloo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              toolName: toolCall.toolName,
              timestamp: Date.now(),
              data: toolCall.data?.result || toolCall.data || {},
              success: toolCall.data?.success !== false
            };
            
            console.log('[QLOO_DEBUG] Adding Qloo result to panel:', qlooResult);
            (window as any).addQlooResult(qlooResult);
          } else {
            console.warn('[QLOO_DEBUG] addQlooResult function not available on window');
          }
        }

        const toolId = toolCall.id || Object.values(toolCallIdsRef.current).find(id => 
          messageContentRef.current.includes(`{% tool_start '${toolCall.toolName}' '${id}' %}`)
        );
        
        if (!toolId) {
          console.error('[CHAT] No tool ID found for:', toolCall.toolName, 'Available IDs:', toolCallIdsRef.current);
          return;
        }

        console.log('[CHAT] Completing tool:', toolCall.toolName, 'with ID:', toolId);

        // Create complete tool markdown
        let completeToolMarkdown = `{% tool_complete '${toolCall.toolName}' '${toolId}' %}\n{% tool_description %}${
          toolCall.toolDescription || toolCall.description || 'Completed'
        }{% end_tool_description %}\n`;
        
        if (toolCall.data) {
          completeToolMarkdown += (typeof toolCall.data === 'string' ? toolCall.data : JSON.stringify(toolCall.data, null, 2)) + '\n';
        }
        completeToolMarkdown += '{% endtool %}\n';

        // Use regex to find and replace the tool call by ID instead of exact pattern matching
        const toolStartRegex = new RegExp(`{% tool_start '${toolCall.toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}' '${toolId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}' %}[\\s\\S]*?{% endtool %}`, 'g');
        
        const oldContent = messageContentRef.current;
        messageContentRef.current = messageContentRef.current.replace(toolStartRegex, completeToolMarkdown);
        
        if (oldContent === messageContentRef.current) {
          console.error('[CHAT] Tool replacement failed for:', toolCall.toolName, toolId);
          console.log('[CHAT] Looking for pattern in content');
        } else {
          console.log('[CHAT] Successfully replaced tool:', toolCall.toolName);
        }
        
        updateFullMessage()
      }
    };
  }, [onFlightSearchStart, updateFullMessage]);

  const submitMessage = useCallback(
    async (message: string, flightData?: FlightSearchData, images?: string[]) => {
      console.log('[SUBMIT] submitMessage called with:', message);
      
      if (isLoading) {
        console.log('[SUBMIT] Already loading, returning');
        return;
      }

      // Mark that we have an active request
      abortControllerRef.current = new AbortController();

      // Reset message state
      assistantMsgIdRef.current = null;
      toolCallIdsRef.current = {};
      messageContentRef.current = '';
      lastTextContentRef.current = '';

      console.log('[SUBMIT] Adding user message');
      console.log('[SUBMIT] Images being added to message:', images?.length || 0);
      const messageObj = {
        role: 'user' as const,
        content: message,
        images: images,
      };
      console.log('[SUBMIT] Complete message object:', { ...messageObj, images: messageObj.images?.length || 0 });
      addMessage(messageObj)
      setLoading(true)

      try {
        console.log('[SUBMIT] Getting chat worker');
        const worker = getChatWorker()
        if (!worker) {
          console.error('[SUBMIT] Chat worker not available');
          throw new Error('Chat worker not available')
        }

        const assistantMessage: Omit<ChatMessage, 'id' | 'createdAt'> = {
          role: 'assistant',
          content: '',
        }
        console.log('[SUBMIT] Adding assistant message');
        const assistantMsgId = addMessage(assistantMessage)
        assistantMsgIdRef.current = assistantMsgId

        if (!assistantMsgId) {
          console.error('[SUBMIT] Failed to create assistant message');
          throw new Error('Failed to create assistant message')
        }
        
        const currentMessages = useChatStore.getState().currentSession?.messages ?? []
        console.log('[SUBMIT] Current messages count:', currentMessages.length);
        console.log('[SUBMIT] Messages with images:', currentMessages.filter(m => m.images && m.images.length > 0).map(m => ({ role: m.role, content: m.content.substring(0, 50), imageCount: m.images?.length })));

        // Get panel context in main thread (worker can't access panel registry)
        const currentSessionId = useChatStore.getState().currentSession?.id
        const panelContext = formatPanelContextForAgent(currentSessionId)
        console.log('[SUBMIT] Panel context length:', panelContext.length);

        // Get Shopify credentials in main thread (worker can't access localStorage)
        const credentials = storeManager.getActiveStoreCredentials();
        console.log('[SUBMIT] Shopify credentials available:', !!credentials);

        // Create fresh Comlink proxies for this call
        const proxiedOnUpdate = Comlink.proxy(onUpdateRef.current);
        const proxiedOnToolCall = Comlink.proxy(onToolCallRef.current);
        const proxiedOnPanelUpdate = Comlink.proxy((panelType: string, panelData: any) => {
          console.log('[CHAT] onPanelUpdate called with:', { panelType, panelData });
          try {
            // Convert markdown to HTML for text panels
            if (panelType === 'text-panel' && panelData.content) {
              const { marked } = require('marked');
              console.log('[CHAT] Converting markdown to HTML for text panel');
              panelData.content = marked(panelData.content);
            }
            
            const updateResult = updatePanelData(panelType, panelData, currentSessionId);
            console.log('[CHAT] Panel update result:', updateResult);
          } catch (error) {
            console.error('[CHAT] Error in onPanelUpdate:', error);
          }
        });

        console.log('[SUBMIT] Calling worker.sendMessage with flight data:', flightData);
        await worker.sendMessage(
          message,
          currentMessages,
          flightData,
          proxiedOnUpdate,
          proxiedOnToolCall,
          proxiedOnPanelUpdate,
          currentSessionId,
          panelContext,
          images,
          credentials // Pass Shopify credentials to worker
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
        // Only show error if it's not an abort
        if ((error as any)?.name !== 'AbortError') {
          addMessage({
            role: 'assistant',
            content: "I'm sorry, I encountered an error. Please try again. Error: " + error,
          })
        }
      } finally {
        console.log('[SUBMIT] Setting loading to false');
        setLoading(false)
        abortControllerRef.current = null
      }
    },
    [
      isLoading,
      addMessage,
      setLoading,
      showNotification,
      updateFullMessage,
    ]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent | undefined, message: string, flightData?: FlightSearchData, images?: string[]) => {
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

      if ((!message || !message.trim()) && (!images || images.length === 0) || isLoading) return
      
      await submitMessage(message, flightData, images)
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
    // Also cancel the worker request
    const worker = getChatWorker()
    if (worker) {
      worker.cancel()
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