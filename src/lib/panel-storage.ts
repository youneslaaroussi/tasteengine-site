import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface PanelSession<T = any> {
  id: string
  title: string
  data: T
  createdAt: Date
  updatedAt: Date
}

interface PanelState<T = any> {
  // Current active session
  currentSession: PanelSession<T> | null
  
  // All saved sessions
  sessions: PanelSession<T>[]
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
}

interface PanelActions<T = any> {
  // Session management
  createSession: (title?: string, initialData?: T) => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  
  // Data management
  updateData: (updater: T | ((prevData: T) => T)) => void
  clearData: (defaultData?: T) => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  
  // Export/Import
  exportSession: (sessionId: string) => string
  exportAllSessions: () => string
  importSessions: (data: string) => void
  
  // Utilities
  generateSessionTitle: (data: T) => string
}

type PanelStore<T = any> = PanelState<T> & PanelActions<T>

const createInitialSession = <T>(initialData?: T, title?: string): PanelSession<T> => ({
  id: crypto.randomUUID(),
  title: title || 'New Session',
  data: initialData as T,
  createdAt: new Date(),
  updatedAt: new Date(),
})

export function createPanelStore<T = any>(
  storeName: string,
  defaultData: T,
  titleGenerator?: (data: T) => string
) {
  return create<PanelStore<T>>()(
    persist(
      immer((set, get) => ({
        // Initial state
        currentSession: null,
        sessions: [],
        isLoading: false,
        isSaving: false,
        
        // Session management
        createSession: (title?: string, initialData?: T) => {
          set((state) => {
            const newSession = createInitialSession(
              initialData ?? defaultData, 
              title
            )
            state.currentSession = newSession as any
            state.sessions.unshift(newSession as any)
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
        
        // Data management
        updateData: (updater) => {
          set((state) => {
            if (state.currentSession) {
              if (typeof updater === 'function') {
                state.currentSession.data = (updater as (prev: T) => T)(state.currentSession.data as T) as any
              } else {
                state.currentSession.data = updater as any
              }
              state.currentSession.updatedAt = new Date()
              
              // Update session in sessions array
              const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession!.id)
              if (sessionIndex !== -1) {
                state.sessions[sessionIndex] = state.currentSession as any
              }
            } else {
              // Create new session with data
              const newSession = createInitialSession(
                typeof updater === 'function' ? (updater as (prev: T) => T)(defaultData) : updater
              )
              state.sessions.unshift(newSession as any)
              state.currentSession = newSession as any
            }
          })
        },
        
        clearData: (resetData?: T) => {
          set((state) => {
            if (state.currentSession) {
              state.currentSession.data = (resetData ?? defaultData) as any
              state.currentSession.updatedAt = new Date()
              
              // Update session in sessions array
              const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession!.id)
              if (sessionIndex !== -1) {
                state.sessions[sessionIndex] = state.currentSession as any
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
                const importedSession = {
                  ...parsed.session,
                  id: crypto.randomUUID(),
                  createdAt: new Date(parsed.session.createdAt),
                  updatedAt: new Date(parsed.session.updatedAt),
                }
                
                state.sessions.unshift(importedSession)
              } else if (parsed.type === 'all' && parsed.sessions) {
                const importedSessions = parsed.sessions.map((session: any) => ({
                  ...session,
                  id: crypto.randomUUID(),
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
        generateSessionTitle: (data: T) => {
          if (titleGenerator) {
            return titleGenerator(data)
          }
          
          // Default title generation based on data type
          if (typeof data === 'string') {
            return data.slice(0, 50) + (data.length > 50 ? '...' : '')
          }
          
          if (typeof data === 'object' && data !== null) {
            // Try to find a title-like property
            const titleFields = ['title', 'name', 'label', 'text']
            for (const field of titleFields) {
              if (field in data && typeof (data as any)[field] === 'string') {
                const value = (data as any)[field]
                return value.slice(0, 50) + (value.length > 50 ? '...' : '')
              }
            }
            
            // Fallback to JSON preview
            const preview = JSON.stringify(data).slice(0, 50)
            return preview + (JSON.stringify(data).length > 50 ? '...' : '')
          }
          
          return 'New Session'
        },
      })),
      {
        name: storeName,
        partialize: (state) => ({
          sessions: state.sessions,
        }),
      }
    )
  )
} 