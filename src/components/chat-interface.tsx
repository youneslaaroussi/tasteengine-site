'use client';

import { useChat } from '@ai-sdk/react';
import { ChatMessage } from './chat-message';
import { ChatInput, ChatInputRef } from './chat-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { Plane, ChevronDown } from 'lucide-react';

// Move initial messages outside component to prevent recreation on every render
const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant' as const,
    content: "Hi! I'm your travel assistant. I can help you search for flights, find travel deals, and plan your trips. What can I help you with today?",
  },
];

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput } = useChat({
    api: '/api/chat',
    initialMessages: INITIAL_MESSAGES,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const isAutoScrolling = useRef<boolean>(false);
  const lastMessageLength = useRef<number>(0);
  const prevIsLoading = useRef<boolean>(false);
  
  // Track if user is at the bottom of the scroll area
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Threshold for considering "near bottom" (in pixels)
  const BOTTOM_THRESHOLD = 30;

  // Check if user is at or near the bottom of the scroll area
  const checkIfAtBottom = useCallback(() => {
    if (!scrollAreaRef.current) return false;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
    if (!scrollElement) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom <= BOTTOM_THRESHOLD;
  }, []);

  // Handle manual scroll events
  const handleScroll = useCallback(() => {
    if (isAutoScrolling.current) return;
    
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
  }, [checkIfAtBottom]);

  // Set up scroll event listener
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Instant scroll to bottom (for streaming)
  const scrollToBottomInstant = useCallback(() => {
    if (!messagesEndRef.current || !isAtBottom) return;
    
    isAutoScrolling.current = true;
    messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    
    // Reset flag quickly for instant scrolling
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 50);
  }, [isAtBottom]);

  // Smooth scroll to bottom (for manual action)
  const scrollToBottomSmooth = useCallback(() => {
    if (!messagesEndRef.current) return;
    
    isAutoScrolling.current = true;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    
    setTimeout(() => {
      isAutoScrolling.current = false;
      setIsAtBottom(true);
    }, 300);
  }, []);

  // Focus input when loading completes
  useEffect(() => {
    // If loading just stopped (was true, now false), focus the input
    if (prevIsLoading.current && !isLoading) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100); // Small delay to ensure UI has updated
    }
    
    prevIsLoading.current = isLoading;
  }, [isLoading]);

  // Focus input on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      chatInputRef.current?.focus();
    }, 200); // Delay to ensure everything is mounted
    
    return () => clearTimeout(timer);
  }, []);

  // Track content changes for streaming
  useEffect(() => {
    if (!isLoading) {
      lastMessageLength.current = 0;
      return;
    }

    const currentMessage = messages[messages.length - 1];
    if (!currentMessage || currentMessage.role === 'user') return;

    const currentLength = currentMessage.content.length;
    
    // If content is growing (streaming) and we're at bottom, scroll instantly
    if (currentLength > lastMessageLength.current && isAtBottom) {
      scrollToBottomInstant();
    }
    
    lastMessageLength.current = currentLength;
  }, [messages, isLoading, isAtBottom, scrollToBottomInstant]);

  // Scroll when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      // Use smooth scroll for new messages, instant for streaming content
      if (isLoading) {
        scrollToBottomInstant();
      } else {
        scrollToBottomSmooth();
      }
    }
  }, [messages.length, isAtBottom, isLoading, scrollToBottomInstant, scrollToBottomSmooth]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottomSmooth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [scrollToBottomSmooth]);

  // Memoize the messages rendering to prevent unnecessary re-renders
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <ChatMessage
        key={message.id}
        message={message}
        isStreaming={isLoading && index === messages.length - 1}
      />
    ));
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Travel Assistant</h1>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-3xl mx-auto">
            {renderedMessages}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Scroll to bottom button - only show when not at bottom */}
        {!isAtBottom && (
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={scrollToBottomSmooth}
              size="sm"
              className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            ref={chatInputRef}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
} 