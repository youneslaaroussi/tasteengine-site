'use client';

import { useState, useCallback } from 'react';
import { useChat, CreateMessage, Message } from '@ai-sdk/react';

export function useDirectChat({ initialMessages }: { initialMessages: CreateMessage[] }) {
  const [activeTools, setActiveTools] = useState(new Set<string>());
  const [isStreaming, setIsStreaming] = useState(false);

  // Use the AI SDK useChat hook for state management
  const { messages, setMessages, input, setInput, handleInputChange } = useChat({
    initialMessages: initialMessages.map(m => ({
      ...m,
      id: m.id || Date.now().toString(),
      createdAt: m.createdAt || new Date(),
    })),
  });

  // Custom handleSubmit to call the backend directly
  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input) return;

    // Add user message to the chat
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, createdAt: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear the input field
    const currentInput = input;
    setInput('');
    
    setIsStreaming(true);

    // Prepare the request for the backend
    const backendRequest = {
      message: currentInput,
      conversationHistory: [...messages.map(m => ({role: m.role, content: m.content})), { role: 'user', content: currentInput }],
    };

    try {
      // Make request to the backend stream endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agent/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendRequest),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const reader = response.body.getReader();
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
                
                // If there's data field, append the JSON so the parser can find it
                if (data.data) {
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
      console.error('Direct chat error:', error);
      // Handle error case, maybe show an error message to the user
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "I'm sorry, I encountered an error. Please try again.", createdAt: new Date() }]);
    } finally {
      setIsStreaming(false);
      setActiveTools(new Set());
    }
  }, [input, messages, setMessages, setInput]);

  return { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading: isStreaming, 
    stop: () => {}, // Implement stop functionality if needed
    setInput, 
    setMessages, 
    activeTools 
  };
} 