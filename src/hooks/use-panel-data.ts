'use client'

import { useCallback, useMemo } from 'react'
import { createPanelStore } from '@/lib/panel-storage'

// Global store cache to ensure we reuse the same store instance for the same panel type
const storeCache = new Map<string, any>()

// Export the store cache so other modules can access it
export { storeCache }

export interface UsePanelDataOptions<T> {
  storeName: string
  defaultData: T  
  titleGenerator?: (data: T) => string
  sessionKey?: string // Optional key to tie data to a specific session/context
}

export function usePanelData<T = any>({
  storeName,
  defaultData,
  titleGenerator,
  sessionKey
}: UsePanelDataOptions<T>) {
  // Get or create the store for this panel type with session key
  const effectiveStoreName = sessionKey ? `${storeName}-${sessionKey}` : storeName
  const store = useMemo(() => {
    if (!storeCache.has(effectiveStoreName)) {
      storeCache.set(effectiveStoreName, createPanelStore(effectiveStoreName, defaultData, titleGenerator))
    }
    return storeCache.get(effectiveStoreName)
  }, [effectiveStoreName, defaultData, titleGenerator])

  // Get the current state from the store
  const {
    currentSession,
    sessions,
    isLoading,
    isSaving,
    updateData,
    clearData,
    createSession,
    loadSession,
    deleteSession,
    updateSessionTitle,
    setLoading,
    setSaving,
    exportSession,
    exportAllSessions,
    importSessions,
    generateSessionTitle,
  } = store()

  // Get current data
  const data = currentSession?.data ?? defaultData

  // Simple save function that updates the current data
  const save = useCallback((newData: T | ((prev: T) => T)) => {
    updateData(newData)
  }, [updateData])

  // Load function that switches to a specific session
  const load = useCallback((sessionId: string) => {
    loadSession(sessionId)
  }, [loadSession])

  // Clear function that resets the data
  const clear = useCallback((resetData?: T) => {
    clearData(resetData)
  }, [clearData])

  // Create new session function
  const createNew = useCallback((title?: string, initialData?: T) => {
    createSession(title, initialData)
  }, [createSession])

  // Auto-generate title based on current data
  const updateTitle = useCallback((title?: string) => {
    if (currentSession) {
      const newTitle = title || generateSessionTitle(data)
      updateSessionTitle(currentSession.id, newTitle)
    }
  }, [currentSession, data, generateSessionTitle, updateSessionTitle])

  // Export functions
  const exportCurrent = useCallback(() => {
    if (currentSession) {
      return exportSession(currentSession.id)
    }
    return ''
  }, [currentSession, exportSession])

  const exportAll = useCallback(() => {
    return exportAllSessions()
  }, [exportAllSessions])

  // Import function
  const importData = useCallback((jsonData: string) => {
    importSessions(jsonData)
  }, [importSessions])

  return {
    // Current data
    data,
    currentSession,
    
    // All sessions for history/switching
    sessions,
    
    // Loading states
    isLoading,
    isSaving,
    setLoading,
    setSaving,
    
    // Data manipulation
    save,
    load,
    clear,
    
    // Session management
    createNew,
    deleteSession,
    updateTitle,
    
    // Export/Import
    exportCurrent,
    exportAll,
    importData,
  }
} 