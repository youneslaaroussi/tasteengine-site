// src/hooks/use-message-processor.ts

import { useEffect } from 'react';
import { useChatContext } from '@/contexts/chat-context';
import { useFlightSearch } from '@/contexts/flight-search-provider';
import { usePrevious } from '@/hooks/use-previous';
import { useChatStore } from '@/stores/chat-store';
import { addFlightResultsToChat, shouldAddFlightResults } from '@/lib/flight-chat-integration';
import { agentMessageQueue } from '@/lib/agent-message-queue';

export function useMessageProcessor() {
  const { searchId, isSearching, flights } = useFlightSearch();
  const wasSearching = usePrevious(isSearching);
  const { addMessage } = useChatStore();
  const { submitMessage, isLoading } = useChatContext();

  useEffect(() => {
    // Initialize the message queue with the sender function
    agentMessageQueue.initialize(submitMessage);
  }, [submitMessage]);

  useEffect(() => {
    // When a message stream ends, notify the queue
    if (!isLoading) {
      agentMessageQueue.onMessageStreamEnd();
    }
  }, [isLoading]);
  
  useEffect(() => {
    // CRITICAL FIX: Only add flight results when not currently loading to avoid interfering with ongoing streams
    if (shouldAddFlightResults(wasSearching ?? false, isSearching, flights) && !isLoading) {
      console.log('[MESSAGE_PROCESSOR] Adding flight results to chat - flights:', flights.length, 'searchId:', searchId);
      
      // Use a small delay to ensure any ongoing message streams have completed
      setTimeout(() => {
        // Double-check we're still not loading before adding
        if (!useChatStore.getState().isLoading) {
          addFlightResultsToChat(
            {
              flights,
              searchId: searchId || undefined,
              totalFound: flights.length,
            },
            addMessage
          );
        }
      }, 100);
    }
  }, [wasSearching, isSearching, flights, searchId, addMessage, isLoading]);
} 