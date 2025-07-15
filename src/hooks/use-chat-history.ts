import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatHistoryState } from '@/types/chat-history';

const STORAGE_KEY = 'goflyto-chat-history';

export const useChatHistory = () => {
  const [state, setState] = useState<ChatHistoryState>({
    sessions: [],
    currentSessionId: null,
  });

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const sessions = parsed.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }));
        setState({ ...parsed, sessions });
      }
    } catch (error) {
      console.error('Failed to load chat history from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever state changes
  const saveToStorage = useCallback((newState: ChatHistoryState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save chat history to localStorage:', error);
    }
  }, []);

  // Generate a title from the first user message
  const generateTitle = (messages: ChatSession['messages']): string => {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    const content = firstUserMessage.content.trim();
    if (content.length <= 50) return content;
    return content.substring(0, 47) + '...';
  };

  // Create a new chat session
  const createNewSession = useCallback((messages: ChatSession['messages'] = []) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: generateTitle(messages),
      messages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState(prevState => {
      const newState = {
        sessions: [newSession, ...prevState.sessions],
        currentSessionId: newSession.id,
      };

      saveToStorage(newState);
      return newState;
    });

    return newSession.id;
  }, [saveToStorage]);

  // Update current session
  const updateCurrentSession = useCallback((messages: ChatSession['messages']) => {
    setState(prevState => {
      if (!prevState.currentSessionId) {
        // If no current session, create a new one
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: generateTitle(messages),
          messages,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newState = {
          sessions: [newSession, ...prevState.sessions],
          currentSessionId: newSession.id,
        };

        saveToStorage(newState);
        return newState;
      }

      const newState = {
        ...prevState,
        sessions: prevState.sessions.map(session => 
          session.id === prevState.currentSessionId 
            ? {
                ...session,
                messages,
                title: generateTitle(messages),
                updatedAt: new Date(),
              }
            : session
        ),
      };

      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  // Load a specific session
  const loadSession = useCallback((sessionId: string) => {
    let foundSession: ChatSession | null = null;
    
    setState(prevState => {
      const session = prevState.sessions.find(s => s.id === sessionId);
      if (!session) return prevState;

      foundSession = session;
      const newState = { ...prevState, currentSessionId: sessionId };
      saveToStorage(newState);
      return newState;
    });

    return foundSession;
  }, [saveToStorage]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setState(prevState => {
      const newState = {
        sessions: prevState.sessions.filter(s => s.id !== sessionId),
        currentSessionId: prevState.currentSessionId === sessionId ? null : prevState.currentSessionId,
      };

      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  // Clear all history
  const clearHistory = useCallback(() => {
    const newState = { sessions: [], currentSessionId: null };
    setState(newState);
    saveToStorage(newState);
  }, [saveToStorage]);

  // Get current session
  const getCurrentSession = useCallback(() => {
    if (!state.currentSessionId) return null;
    return state.sessions.find(s => s.id === state.currentSessionId) || null;
  }, [state.currentSessionId, state.sessions]);

  return {
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    currentSession: getCurrentSession(),
    createNewSession,
    updateCurrentSession,
    loadSession,
    deleteSession,
    clearHistory,
  };
}; 