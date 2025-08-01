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
    // Coordinate stream state with message queue
    if (isLoading) {
      agentMessageQueue.onMessageStreamStart();
    } else {
      agentMessageQueue.onMessageStreamEnd();
    }
  }, [isLoading]);
  
  useEffect(() => {
    // Add flight results when search completes
    // The message queue will handle coordination with ongoing streams
    if (shouldAddFlightResults(wasSearching ?? false, isSearching, flights)) {
      console.log('[MESSAGE_PROCESSOR] Adding flight results to campaign - flights:', flights.length, 'searchId:', searchId);
      
      addFlightResultsToChat(
        {
          flights,
          searchId: searchId || undefined,
          totalFound: flights.length,
        },
        addMessage
      );
    }
  }, [wasSearching, isSearching, flights, searchId, addMessage]);
} 