'use client';

import { useDirectChat } from '@/hooks/use-direct-chat';
import { ChatMessage } from './chat-message';
import { ChatInput, ChatInputRef } from './chat-input';
import { PromptCards } from './prompt-cards';
import { useEffect, useRef, useMemo, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { useChatHistory } from '@/hooks/use-chat-history';
import { ChatSession } from '@/types/chat-history';
import { trackChatEvent, trackChatHistoryEvent } from '@/lib/gtag';
import { useFlightSearch } from '@/contexts/flight-search-context';

// Move initial messages outside component to prevent recreation on every render
const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant' as const,
    content: "Hi! I'm your travel assistant. I can help you search for flights, find travel deals, and plan your trips. What can I help you with today?",
    createdAt: new Date(),
  },
];

export interface ChatInterfaceRef {
  resetChat: () => void;
  loadSession: (session: ChatSession) => void;
}

export const ChatInterface = forwardRef<ChatInterfaceRef>((props, ref) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setInput, setMessages } = useDirectChat({
    initialMessages: INITIAL_MESSAGES,
  });

  const { isSearching: isFlightSearching, flights, pricingTokens, resetSearch: resetFlightSearch } = useFlightSearch();

  const { updateCurrentSession, createNewSession, currentSession, loadSession: loadSessionFromHistory } = useChatHistory();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const prevIsLoading = useRef<boolean>(false);
  
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Scroll to bottom when messages change or streaming ends
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // Small delay to allow layout to settle
    
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

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

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 1) { // Only save if there are messages beyond the initial welcome message
      const messageData = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
      updateCurrentSession(messageData);
    }
  }, [messages, updateCurrentSession]);

  // Check if there are any user messages
  const hasUserMessages = useMemo(() => {
    return messages.some(message => message.role === 'user');
  }, [messages]);

  // Wrapper for handleSubmit to include flight data
  const handleFormSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const flightData = { flights, pricingTokens };
    handleSubmit(e, { flightData });
  }, [handleSubmit, flights, pricingTokens]);

  // Handle prompt card clicks
  const handlePromptClick = useCallback((prompt: string) => {
    setInput(prompt);
    
    // Track prompt card click
    trackChatEvent('prompt_submit', {
      message_type: 'prompt_card',
      message_length: prompt.length,
      session_id: currentSession?.id,
    });
    
    // Auto-submit the prompt after a brief delay
    setTimeout(() => {
      if (chatInputRef.current) {
        handleFormSubmit();
      }
    }, 100);
  }, [setInput, handleFormSubmit, currentSession?.id]);

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

  // Reset chat function
  const resetChat = useCallback(() => {
    // Stop any ongoing requests
    stop();
    
    // Track new chat event
    trackChatHistoryEvent('new_chat');
    
    // Reset messages to initial state
    setMessages(INITIAL_MESSAGES);
    
    // Clear input
    setInput('');
    
    // Create new session (this will automatically update the current session)
    createNewSession();

    // Reset flight search
    resetFlightSearch();
    
    // Reset scroll position
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Focus input
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 200);
  }, [stop, setMessages, setInput, createNewSession, scrollToBottom, resetFlightSearch]);

  // Load session function
  const loadSession = useCallback((session: ChatSession) => {
    // Stop any ongoing requests
    stop();
    
    // Track session load event
    trackChatHistoryEvent('load_session');
    
    // Load session in history
    loadSessionFromHistory(session.id);
    
    // Load session messages
    setMessages(session.messages);
    
    // Clear input
    setInput('');

    // Reset flight search
    resetFlightSearch();
    
    // Reset scroll position
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Focus input
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 200);
  }, [stop, loadSessionFromHistory, setMessages, setInput, scrollToBottom, resetFlightSearch]);

  // Expose functions through ref
  useImperativeHandle(ref, () => ({
    resetChat,
    loadSession,
  }));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {renderedMessages}
          
          {/* Show prompt cards only when there are no user messages */}
          {!hasUserMessages && !isLoading && (
            <div className="mt-8 mb-8">
              <PromptCards onPromptClick={handlePromptClick} />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            ref={chatInputRef}
            input={input}
            setInput={setInput}
            handleSubmit={handleFormSubmit}
            isLoading={isLoading || isFlightSearching}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface'; 