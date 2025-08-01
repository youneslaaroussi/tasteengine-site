/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import { nanoid } from 'nanoid';
import { ChatMessage, FlightSearchData } from '@/types/chat';
import { memoryService, SaveToMemoryToolCall } from '@/lib/memory-service';
import { MemoryDto } from '@/types/memory';
import { updatePanelData } from '@/lib/panel-context';

// Store current abort controller
let currentAbortController: AbortController | null = null;

// Store tool IDs to ensure consistent pairing of tool_start and tool_complete
const toolIdMap = new Map<string, string>();

const chatApi = {
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[],
    flightData: FlightSearchData | undefined,
    onUpdate: (update: string) => void,
    onToolCall: (toolCall: any) => void,
    onPanelUpdate: (panelType: string, panelData: any) => void,
    chatSessionId?: string,
    panelContext?: string,
    images?: string[],
    credentials?: { shopDomain: string; accessToken: string } | null,
    documents?: any[] // Add documents parameter
  ) {
    console.log('[WORKER] Starting sendMessage');
    console.log('[WORKER] Flight data provided:', flightData);
    
    // Create abort controller for this request
    currentAbortController = new AbortController();
    
    // Clear tool ID map for fresh conversation
    toolIdMap.clear();
    
    // Get memories to include in the request
    const memories = await memoryService.getMemoriesForChat();
    console.log('[WORKER] Memories loaded:', memories.length);
    console.log('[WORKER] Panel context received:', panelContext ? panelContext.length : 0, 'characters');
    console.log('[WORKER] Conversation history with images:', conversationHistory.filter(m => m.images && m.images.length > 0).map(m => ({ role: m.role, content: m.content.substring(0, 30), imageCount: m.images?.length })));
    
    // Log Shopify credentials availability
    console.log('[WORKER] Shopify credentials available:', !!credentials);
    
    // Build conversation history including flight context - preserve original message structure
    const conversationWithFlights = conversationHistory.map(msg => {
      // Include flight context for data messages
      if (msg.role === 'data' && msg.flights && msg.searchId) {
        return {
          ...msg,
          content: `${msg.content} [Flight search results: ${msg.flights.length} flights found for search ID ${msg.searchId}. Flight details: ${JSON.stringify(msg.flights.slice(0, 3))}]`,
        };
      }
      
      // For all other messages, preserve the original structure completely
      return msg;
    });

    // Add current flight context if available
    let contextMessage = '';
    if (flightData && flightData.flights && flightData.flights.length > 0) {
      contextMessage = `\n\nCurrent flight search context: ${flightData.flights.length} flights available for search ID ${flightData.searchId}. Recent flights: ${JSON.stringify(flightData.flights.slice(0, 3))}`;
    }
    
    // Add panel context to the message
    if (panelContext && panelContext.length > 0) {
      contextMessage += panelContext;
    }
    
    if (contextMessage) {
      message = message + contextMessage;
      console.log('[WORKER] Added context to message (flight + panels)');
    }
    
    const requestBody = {
      message,
      conversationHistory: conversationWithFlights,
      memories,
      images,
      documents, // Add documents to request body
      // Include Shopify credentials if available
      ...(credentials && {
        shopDomain: credentials.shopDomain,
        accessToken: credentials.accessToken
      })
    };

    console.log('[WORKER] Request body conversation history length:', conversationWithFlights.length);
    if (documents && documents.length > 0) {
      console.log('[WORKER] Sending documents to backend:', documents.map((d: any) => ({ name: d.name, type: d.type, size: d.size })));
    }

    try {
      // Make request to external API with abort signal
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: currentAbortController.signal, // Use worker's abort controller
      });

      if (!response.ok || !response.body) {
        throw new Error(`API responded with ${response.status}`);
      }

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      let currentEvent = '';
      let currentId = '';
      let currentData = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        // Parse SSE format - collect all parts of an event
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('event: ')) {
            currentEvent = trimmedLine.slice(7);
          } else if (trimmedLine.startsWith('id: ')) {
            currentId = trimmedLine.slice(4);
          } else if (trimmedLine.startsWith('data: ')) {
            // Accumulate data lines to handle multi-line SSE payloads correctly
            const lineData = trimmedLine.slice(6);
            if (currentData) {
              currentData += lineData;
            } else {
              currentData = lineData;
            }
                  } else if (trimmedLine === '') {
          // Empty line indicates end of event - process if we have data
          if (currentData) {
            // Check for special termination marker
            if (currentData === '[DONE]') {
              console.log('[WORKER] Received [DONE] marker, ending stream');
              break;
            }
            
            try {
              const data = JSON.parse(currentData);
                console.log('[WORKER] Parsed event:', { event: currentEvent, id: currentId, type: data.type, contentLength: data.content?.length });
                if (data.type === 'tool_result') {
                  console.log('[WORKER] DEBUG tool_result:', data);
                }

                if (data.type === 'message' && data.content) {
                  // Handle streaming message content from new backend format
                  content += data.content;
                  console.log('[WORKER] Message chunk received, total length:', content.length);
                  onUpdate(content);
                } else if (data.type === 'connected') {
                  // Handle connection event
                  console.log('[WORKER] Connected to AI service:', data.content);
                } else if (data.type === 'content_stream' && data.content) {
                  // Legacy format support
                  content += data.content;
                  console.log('[WORKER] Content stream update, total length:', content.length);
                  onUpdate(content);
                } else if (data.type === 'content' && data.content) {
                  // Legacy format support - Handle final content event
                  console.log('[WORKER] Final content received, length:', data.content.length);
                  console.log('[WORKER] Final content preview:', data.content.substring(0, 100) + '...');
                  content = data.content;
                  console.log('[WORKER] Calling onUpdate with final content, length:', content.length);
                  onUpdate(content);
                } else if (data.type === 'tool_start' && data.toolName) {
                  console.log('[WORKER] Tool start:', data.toolName);
                  onToolCall(data);
                } else if (data.type === 'tool_complete' && data.toolName) {
                  console.log('[WORKER] Tool complete:', data.toolName);
                  
                  // Handle save_to_memory tool specifically
                  if (data.toolName === 'save_to_memory' && (data.parameters || data.data)) {
                    console.log('[WORKER] Handling save_to_memory tool call');
                    try {
                      let toolParams = data.parameters;

                      if (!toolParams && data.data) {
                        const callKey = Object.keys(data.data)[0];
                        const callData = callKey ? data.data[callKey] : null;
                        if (callData && callData.memoryItem) {
                          toolParams = callData.memoryItem;
                        } else {
                          toolParams = callData;
                        }
                      }

                      if (!toolParams) throw new Error('Could not find parameters for save_to_memory');

                      const toolCall: SaveToMemoryToolCall = {
                        id: data.id || nanoid(),
                        toolName: 'save_to_memory',
                        description: data.toolDescription || data.description || 'Save information to memory',
                        parameters: toolParams,
                      };
                      
                      const result = await memoryService.handleSaveToMemoryTool(toolCall);
                      console.log('[WORKER] Memory save result:', result);
                      
                      // The frontend expects the result in the `data` property
                      data.data = result;
                      delete (data as any).result;
                      delete (data as any).parameters;

                    } catch (error) {
                      console.error('[WORKER] Error handling save_to_memory tool:', error);
                      data.data = {
                        success: false,
                        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                      };
                    }
                  }
                  
                  // Handle update_panel tool specifically
                  if (data.toolName === 'update_panel' && (data.parameters || data.data)) {
                    console.log('[WORKER] Handling update_panel tool call');
                    try {
                      let toolParams = data.parameters;

                      if (!toolParams && data.data) {
                        const callKey = Object.keys(data.data)[0];
                        const callData = callKey ? data.data[callKey] : null;
                        toolParams = callData;
                      }

                      if (!toolParams || !toolParams.panelType) {
                        throw new Error('Could not find parameters for update_panel or missing panelType');
                      }

                      const result = updatePanelData(
                        toolParams.panelType,
                        toolParams.data,
                        chatSessionId
                      );
                      console.log('[WORKER] Panel update result:', result);
                      
                      // The frontend expects the result in the `data` property
                      data.data = result;
                      delete (data as any).result;
                      delete (data as any).parameters;

                    } catch (error) {
                      console.error('[WORKER] Error handling update_panel tool:', error);
                      data.data = {
                        success: false,
                        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                      };
                    }
                  }
                  
                  onToolCall(data);
                } else if (data.type === 'tool_call' && data.data?.tool_name) {
                  // Handle new backend tool call format
                  console.log('[WORKER] Tool call:', data.data.tool_name);
                  
                  // Generate consistent ID for this tool call
                  const toolId = nanoid();
                  const toolKey = `${data.data.tool_name}_${Date.now()}`;
                  toolIdMap.set(toolKey, toolId);
                  console.log('[WORKER] Tool start ID generated:', toolId, 'for', data.data.tool_name);
                  
                  const toolData = {
                    type: 'tool_start',
                    toolName: data.data.tool_name,
                    id: toolId,
                    ...data.data
                  };
                  onToolCall(toolData);
                } else if (data.type === 'tool_result' && data.data?.tool_name) {
                  // Handle new backend tool result format
                  console.log('[WORKER] Tool result:', data.data.tool_name);
                  
                  // Find the matching tool ID for this result
                  let matchingToolId: string | undefined;
                  for (const [toolKey, toolId] of toolIdMap.entries()) {
                    if (toolKey.startsWith(`${data.data.tool_name}_`)) {
                      matchingToolId = toolId;
                      toolIdMap.delete(toolKey); // Remove to prevent reuse
                      break;
                    }
                  }
                  
                  if (!matchingToolId) {
                    console.warn('[WORKER] No matching tool ID found for:', data.data.tool_name);
                    matchingToolId = nanoid(); // Fallback
                  } else {
                    console.log('[WORKER] Tool complete ID matched:', matchingToolId, 'for', data.data.tool_name);
                  }
                  
                  // Handle update_panel tool specifically for new backend format
                  if (data.data.tool_name === 'update_panel' && data.data.result) {
                    console.log('[WORKER] Found update_panel tool result, calling onPanelUpdate directly');
                    const result = data.data.result;
                    
                    if (result.panelType) {
                      // Extract panel data (everything except metadata)
                      const { panelType, success, message, action, timestamp, ...panelData } = result;
                      
                      console.log('[WORKER] Calling onPanelUpdate with:', { panelType, panelData });
                      onPanelUpdate(panelType, panelData);
                    }
                  }
                  
                  const toolData = {
                    type: 'tool_complete',
                    toolName: data.data.tool_name,
                    id: matchingToolId,
                    data: data.data.result || data.data,
                    ...data.data
                  };
                  onToolCall(toolData);
                } else if (data.type === 'reasoning_start') {
                  console.log('[WORKER] Reasoning started:', data.content);
                } else if (data.type === 'reasoning_end') {
                  console.log('[WORKER] Reasoning ended:', data.content);
                } else if (data.type === 'status') {
                  console.log('[WORKER] Status update:', data.content);
                } else if (data.type === 'error') {
                  console.error('[WORKER] Stream error:', data.content);
                  // Display error to user
                  const errorMessage = data.data?.error || data.content || 'An unknown error occurred';
                  content += `\n\n**Error**: ${errorMessage}`;
                  onUpdate(content);
                } else if (data.type === 'complete') {
                  // Conversation completed
                  console.log('[WORKER] Conversation completed');
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError, 'Raw data:', currentData);
              }
            }
            
            // Reset for next event
            currentEvent = '';
            currentId = '';
            currentData = '';
          }
        }
      }
      
      // Final processing for any remaining data in the buffer, in case the stream
      // ends without a final newline.
      if (currentData) {
        try {
          const data = JSON.parse(currentData);
          console.log('[WORKER] Parsed event (final):', { event: currentEvent, id: currentId, type: data.type, contentLength: data.content?.length });

          if (data.type === 'message' && data.content) {
            // Handle streaming message content from new backend format
            content += data.content;
            onUpdate(content);
          } else if (data.type === 'connected') {
            // Handle connection event
            console.log('[WORKER] Connected to AI service (final):', data.content);
          } else if (data.type === 'content_stream' && data.content) {
            // Legacy format support
            content += data.content;
            onUpdate(content);
          } else if (data.type === 'content' && data.content) {
            // Legacy format support
            content = data.content;
            onUpdate(content);
          } else if (data.type === 'error') {
            console.error('[WORKER] Stream error (final):', data.content);
            // Display error to user
            const errorMessage = data.data?.error || data.content || 'An unknown error occurred';
            content += `\n\n**Error**: ${errorMessage}`;
            onUpdate(content);
          } else if (data.type === 'tool_complete' && data.toolName) {
              if (data.toolName === 'save_to_memory' && (data.parameters || data.data)) {
                try {
                  let toolParams = data.parameters;
                  if (!toolParams && data.data) {
                    const callKey = Object.keys(data.data)[0];
                    const callData = callKey ? data.data[callKey] : null;
                    if (callData && callData.memoryItem) {
                      toolParams = callData.memoryItem;
                    } else {
                      toolParams = callData;
                    }
                  }
                  if (!toolParams) throw new Error('Could not find parameters for save_to_memory');
                  const toolCall: SaveToMemoryToolCall = {
                    id: data.id || nanoid(),
                    toolName: 'save_to_memory',
                    description: data.toolDescription || data.description || 'Save information to memory',
                    parameters: toolParams,
                  };
                  const result = await memoryService.handleSaveToMemoryTool(toolCall);
                  data.data = result;
                  delete (data as any).result;
                  delete (data as any).parameters;
                } catch (error) {
                  console.error('[WORKER] Error handling save_to_memory tool (final):', error);
                  data.data = { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }
              }
              
              if (data.toolName === 'update_panel' && (data.parameters || data.data)) {
                try {
                  let toolParams = data.parameters;
                  if (!toolParams && data.data) {
                    const callKey = Object.keys(data.data)[0];
                    const callData = callKey ? data.data[callKey] : null;
                    toolParams = callData;
                  }
                  if (!toolParams || !toolParams.panelType) {
                    throw new Error('Could not find parameters for update_panel or missing panelType');
                  }
                  const result = updatePanelData(
                    toolParams.panelType,
                    toolParams.data,
                    chatSessionId
                  );
                  data.data = result;
                  delete (data as any).result;
                  delete (data as any).parameters;
                } catch (error) {
                  console.error('[WORKER] Error handling update_panel tool (final):', error);
                  data.data = { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
                }
              }
              onToolCall(data);
          }
        } catch (parseError) {
          console.error('Error parsing SSE data (final):', parseError, 'Raw data:', currentData);
        }
      }

      console.log('[WORKER] Final return content length:', content.length);
      return content;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('[WORKER] Request aborted by user.');
        return 'Request aborted by user.';
      }
      console.error('[WORKER] Error sending message:', error);
      throw error;
    } finally {
      currentAbortController = null; // Clear the controller after the request
    }
  },

  cancel() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
      console.log('[WORKER] Campaign request cancelled.');
    }
  },
};

export type ChatWorker = typeof chatApi;

Comlink.expose(chatApi); 