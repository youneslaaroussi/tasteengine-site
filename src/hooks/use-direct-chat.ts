'use client';

import { useState, useCallback } from 'react';
import { useChat, CreateMessage, Message } from '@ai-sdk/react';
import { BookingFlightOption } from '@/types/flights';

export function useDirectChat({ initialMessages }: { initialMessages: CreateMessage[] }) {
  const [activeTools, setActiveTools] = useState(new Set<string>());
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Use the AI SDK useChat hook for state management
  const { messages, setMessages, input, setInput, handleInputChange } = useChat({
    initialMessages: initialMessages.map(m => ({
      ...m,
      id: m.id || Date.now().toString(),
      createdAt: m.createdAt || new Date(),
    })),
  });

  // Custom handleSubmit to call the backend directly
  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>, options?: {
    flightData?: {
        flights: BookingFlightOption[];
        pricingTokens: Record<string, string>;
    }
  }) => {
    e?.preventDefault();
    if (!input || isStreaming) return;

    // Add user message to the chat
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, createdAt: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear the input field
    const currentInput = input;
    setInput('');
    
    setIsStreaming(true);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Prepare the request for the backend
    const conversationHistory: {role: string, content: string}[] = [...messages.map(m => ({role: m.role, content: m.content})), { role: 'user', content: currentInput }];

    if (options?.flightData && options.flightData.flights.length > 0) {
      const flightDataMessageContent = {
        toolName: 'search_bookable_flights',
        data: {
          flights: options.flightData.flights,
          pricingTokens: options.flightData.pricingTokens,
        }
      };
      
      const dataMessage = {
        role: 'data' as const,
        content: JSON.stringify(flightDataMessageContent)
      };

      // Insert data message before the last user message
      conversationHistory.splice(conversationHistory.length - 1, 0, dataMessage);
    }

    const backendRequest = {
      message: currentInput,
      conversationHistory: conversationHistory,
    };

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      // Make request to the backend stream endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agent/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendRequest),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = '';

      // Add a placeholder for the assistant's message
      const assistantMessageId = Date.now().toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', createdAt: new Date() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);

              // Handle various data types from the stream
              if (data.type === 'content_stream' && data.content) {
                assistantMessage += data.content;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId ? { ...msg, content: msg.content + data.content } : msg
                ));
              }
              
              else if (data.type === 'tool_start' && data.toolName) {
                setActiveTools(prev => new Set(prev).add(data.toolName));
                const toolMarkdown = `\n{% ${data.toolName}_start "${data.toolDescription}" %}\n`;
                assistantMessage += toolMarkdown;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId ? { ...msg, content: msg.content + toolMarkdown } : msg
                ));
              }

              else if (data.type === 'tool_complete' && data.toolName) {
                setActiveTools(prev => {
                  const newTools = new Set(prev);
                  newTools.delete(data.toolName);
                  return newTools;
                });
                let toolMarkdown = `{% ${data.toolName}_complete "${data.content}" %}\n\n`;
                
                // Append JSON for flight itinerary and booking tools
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
                ];
                
                if (data.data && bookingTools.includes(data.toolName)) {
                  toolMarkdown += JSON.stringify(data.data, null, 2) + '\n\n';
                }
                
                assistantMessage += toolMarkdown;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId ? { ...msg, content: msg.content + toolMarkdown } : msg
                ));
              }
              
              // Add other handlers for reasoning, status, etc. as needed

            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      // Don't show error message if it was aborted by user
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted by user');
      } else {
        console.error('Direct chat error:', error);
        // Handle error case, maybe show an error message to the user
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "I'm sorry, I encountered an error. Please try again.", createdAt: new Date() }]);
      }
    } finally {
      // Clean up reader if it exists
      if (reader) {
        try {
          await reader.cancel();
        } catch (e) {
          // Ignore errors when canceling reader
        }
      }
      setIsStreaming(false);
      setActiveTools(new Set());
      setAbortController(null);
    }
  }, [input, messages, setMessages, setInput, isStreaming]);

  const stop = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading: isStreaming, 
    stop,
    setInput, 
    setMessages, 
    activeTools 
  };
} 