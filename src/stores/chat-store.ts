import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { ChatMessage } from '@/types/chat'
import { nanoid } from 'nanoid'

// Simplified serializable types for flow state
export interface SerializableNodePosition {
  id: string
  x: number
  y: number
}

export interface SerializableViewport {
  x: number
  y: number
  zoom: number
}

export interface FlowState {
  nodePositions: SerializableNodePosition[]
  viewport: SerializableViewport
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  flowState?: FlowState
  createdAt: Date
  updatedAt: Date
}

interface ChatState {
  // Current active session
  currentSession: ChatSession | null
  
  // All saved sessions
  sessions: ChatSession[]
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  
  // UI state
  sidebarOpen: boolean
  mobileSheetOpen: boolean
}

interface ChatActions {
  // Session management
  createSession: (title?: string) => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  
  // Message management
  addMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => string
  updateMessage: (
    messageId: string, 
    updater: string | ((prevContent: string) => string)
  ) => void
  clearMessages: () => void
  
  // Flow state management
  saveFlowState: (flowState: FlowState) => void
  getFlowState: () => FlowState | undefined
  clearFlowState: () => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  
  // UI state
  setSidebarOpen: (open: boolean) => void
  setMobileSheetOpen: (open: boolean) => void
  
  // Export/Import
  exportSession: (sessionId: string) => string
  exportAllSessions: () => string
  importSessions: (data: string) => void
  
  // Utilities
  generateSessionTitle: (messages: ChatMessage[]) => string
  generateTitleFromAPI: (sessionId: string, text: string) => Promise<void>
  
  // Default chat loading
  loadDefaultChat: () => Promise<void>
}

type ChatStore = ChatState & ChatActions

const createInitialSession = (): ChatSession => ({
  id: crypto.randomUUID(),
  title: 'New Chat',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
})

// API call function for title generation
const generateTitleFromAPI = async (text: string): Promise<string> => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('API endpoint not configured');
  }

  const response = await fetch(`${baseUrl}/generate-title`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate title: ${response.statusText}`);
  }

  const data = await response.json();
  return data.title;
};

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      isLoading: false,
      isSaving: false,
      sidebarOpen: false,
      mobileSheetOpen: false,
      
      // Session management
      createSession: (title?: string) => {
        set((state) => {
          const newSession = createInitialSession()
          if (title) {
            newSession.title = title
          }
          state.currentSession = newSession
          state.sessions.unshift(newSession)
        })
      },
      
      loadSession: (sessionId: string) => {
        set((state) => {
          const session = state.sessions.find(s => s.id === sessionId)
          if (session) {
            state.currentSession = session
          }
        })
      },
      
      deleteSession: (sessionId: string) => {
        set((state) => {
          state.sessions = state.sessions.filter(s => s.id !== sessionId)
          if (state.currentSession?.id === sessionId) {
            state.currentSession = state.sessions[0] || null
          }
        })
      },
      
      updateSessionTitle: (sessionId: string, title: string) => {
        set((state) => {
          const session = state.sessions.find(s => s.id === sessionId)
          if (session) {
            session.title = title
            session.updatedAt = new Date()
          }
          if (state.currentSession?.id === sessionId) {
            state.currentSession.title = title
            state.currentSession.updatedAt = new Date()
          }
        })
      },
      
      // Message management
      addMessage: (message) => {
        console.log('[STORE] Adding message:', { role: message.role, content: message.content.substring(0, 30), hasImages: !!message.images, imageCount: message.images?.length || 0 });
        const newMessage: ChatMessage = {
          ...message,
          id: nanoid(),
          createdAt: new Date(),
        }
        console.log('[STORE] New message created:', { role: newMessage.role, content: newMessage.content.substring(0, 30), hasImages: !!newMessage.images, imageCount: newMessage.images?.length || 0 });
        set(state => {
          if (state.currentSession) {
            state.currentSession.messages.push(newMessage)
            
            // Generate title if this is the first user message and session has default title
            if (
              message.role === 'user' && 
              state.currentSession.title === 'New Chat' &&
              state.currentSession.messages.filter(m => m.role === 'user').length === 1
            ) {
              // Trigger async title generation
              get().generateTitleFromAPI(state.currentSession.id, message.content);
            }
          } else {
            const newSession = createInitialSession()
            newSession.messages.push(newMessage)
            state.sessions.unshift(newSession)
            state.currentSession = newSession
            
            // Generate title if this is a user message
            if (message.role === 'user') {
              get().generateTitleFromAPI(newSession.id, message.content);
            }
          }
        })
        return newMessage.id
      },
      
      updateMessage: (messageId, updateFn) => {
        set(state => {
          if (state.currentSession) {
            const message = state.currentSession.messages.find(m => m.id === messageId)
            if (message) {
              if (typeof updateFn === 'function') {
                message.content = updateFn(message.content)
              } else {
                message.content = updateFn
              }
              state.currentSession.updatedAt = new Date()
              
              // Update session in sessions array
              const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession!.id)
              if (sessionIndex !== -1) {
                state.sessions[sessionIndex] = state.currentSession
              }
            }
          }
        })
      },
      
      clearMessages: () => {
        set((state) => {
          if (state.currentSession) {
            state.currentSession.messages = []
            state.currentSession.updatedAt = new Date()
            
            // Update session in sessions array
            const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession!.id)
            if (sessionIndex !== -1) {
              state.sessions[sessionIndex] = state.currentSession
            }
          }
        })
      },
      
      // Flow state management
      saveFlowState: (flowState: FlowState) => {
        set((state) => {
          if (state.currentSession) {
            state.currentSession.flowState = flowState
            state.currentSession.updatedAt = new Date()
            
            // Update session in sessions array
            const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession!.id)
            if (sessionIndex !== -1) {
              state.sessions[sessionIndex] = state.currentSession
            }
          }
        })
      },
      
      getFlowState: () => {
        return get().currentSession?.flowState
      },
      
      clearFlowState: () => {
        set((state) => {
          if (state.currentSession) {
            state.currentSession.flowState = undefined
            state.currentSession.updatedAt = new Date()
            
            // Update session in sessions array
            const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession!.id)
            if (sessionIndex !== -1) {
              state.sessions[sessionIndex] = state.currentSession
            }
          }
        })
      },
      
      // Loading states
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },
      
      setSaving: (saving: boolean) => {
        set((state) => {
          state.isSaving = saving
        })
      },
      
      // UI state
      setSidebarOpen: (open: boolean) => {
        set((state) => {
          state.sidebarOpen = open
        })
      },
      
      setMobileSheetOpen: (open: boolean) => {
        set((state) => {
          state.mobileSheetOpen = open
        })
      },
      
      // Export/Import
      exportSession: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId)
        if (!session) return ''
        
        return JSON.stringify({
          version: '1.0.0',
          type: 'single',
          session,
          exportedAt: new Date().toISOString(),
        }, null, 2)
      },
      
      exportAllSessions: () => {
        const sessions = get().sessions
        
        return JSON.stringify({
          version: '1.0.0',
          type: 'all',
          sessions,
          exportedAt: new Date().toISOString(),
        }, null, 2)
      },
      
      importSessions: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          
          if (parsed.version !== '1.0.0') {
            throw new Error('Unsupported version')
          }
          
          set((state) => {
            if (parsed.type === 'single' && parsed.session) {
              // Import single session
              const importedSession = {
                ...parsed.session,
                id: crypto.randomUUID(), // Generate new ID to avoid conflicts
                createdAt: new Date(parsed.session.createdAt),
                updatedAt: new Date(parsed.session.updatedAt),
              }
              
              state.sessions.unshift(importedSession)
            } else if (parsed.type === 'all' && parsed.sessions) {
              // Import all sessions
              const importedSessions = parsed.sessions.map((session: any) => ({
                ...session,
                id: crypto.randomUUID(), // Generate new ID to avoid conflicts
                createdAt: new Date(session.createdAt),
                updatedAt: new Date(session.updatedAt),
              }))
              
              state.sessions.push(...importedSessions)
            }
          })
        } catch (error) {
          console.error('Failed to import sessions:', error)
          throw new Error('Invalid import data')
        }
      },
      
      // Utilities
      generateSessionTitle: (messages: ChatMessage[]) => {
        const firstUserMessage = messages.find(m => m.role === 'user')
        if (!firstUserMessage) return 'New Chat'
        
        // Take first 50 characters and add ellipsis if needed
        const title = firstUserMessage.content.slice(0, 50)
        return title.length < firstUserMessage.content.length ? `${title}...` : title
      },

      generateTitleFromAPI: async (sessionId: string, text: string) => {
        try {
          const title = await generateTitleFromAPI(text);
          get().updateSessionTitle(sessionId, title);
        } catch (error) {
          console.error('Failed to generate title:', error);
          // Fall back to the old method if API call fails
          const title = get().generateSessionTitle([{ role: 'user', content: text } as ChatMessage]);
          get().updateSessionTitle(sessionId, title);
        }
      },
      
      loadDefaultChat: async () => {
        try {
          const response = await fetch('/default-chat.json');
          if (!response.ok) {
            console.warn('Default chat file not found, skipping default chat load');
            return;
          }
          
          const defaultChatData = await response.json();
          
          // Convert the JSON data to a proper ChatSession with Date objects
          const defaultSession: ChatSession = {
            ...defaultChatData,
            createdAt: new Date(defaultChatData.createdAt),
            updatedAt: new Date(defaultChatData.updatedAt),
            messages: defaultChatData.messages.map((msg: any) => ({
              ...msg,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            }))
          };
          
          set((state) => {
            // Only load default chat if no sessions exist
            if (state.sessions.length === 0) {
              state.sessions.push(defaultSession);
              state.currentSession = defaultSession;
            }
          });
        } catch (error) {
          console.error('Failed to load default chat:', error);
        }
      },
    })),
    {
      name: 'chat-store',
      // Only persist sessions and UI state, not temporary state
      partialize: (state) => ({
        sessions: state.sessions,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
) 