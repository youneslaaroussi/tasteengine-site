/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import { nanoid } from 'nanoid';
import { ChatMessage, FlightSearchData } from '@/types/chat';

const chatApi = {
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[],
    flightData: FlightSearchData | undefined,
    onUpdate: (update: string) => void,
    onToolCall: (toolCall: any) => void
  ) {
    console.log('[WORKER] Starting sendMessage');
    
    const requestBody = {
      message,
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Make request to external API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agent/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok || !response.body) {
      throw new Error(`API responded with ${response.status}`);
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      // Parse SSE format - collect all parts of an event
      let currentEvent = '';
      let currentId = '';
      let currentData = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('event: ')) {
          currentEvent = trimmedLine.slice(7);
        } else if (trimmedLine.startsWith('id: ')) {
          currentId = trimmedLine.slice(4);
        } else if (trimmedLine.startsWith('data: ')) {
          currentData = trimmedLine.slice(6);
        } else if (trimmedLine === '') {
          // Empty line indicates end of event - process if we have data
          if (currentData) {
            try {
              const data = JSON.parse(currentData);
              console.log('[WORKER] Parsed event:', { event: currentEvent, id: currentId, type: data.type, contentLength: data.content?.length });

              if (data.type === 'content_stream' && data.content) {
                content += data.content;
                console.log('[WORKER] Content stream update, total length:', content.length);
                onUpdate(content);
              } else if (data.type === 'content' && data.content) {
                // Handle final content event - this is the complete message
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
                onToolCall(data);
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

    console.log('[WORKER] Final return content length:', content.length);
    return content;
  },
};

export type ChatWorker = typeof chatApi;

Comlink.expose(chatApi); 