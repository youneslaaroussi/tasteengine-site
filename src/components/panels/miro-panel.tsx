'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePanelData } from '@/hooks/use-panel-data'
import { useChatStore } from '@/stores/chat-store'
import { useMiro } from '@/contexts/miro-context'
import { registerPanel } from '@/lib/panel-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  RefreshCw,
  LayoutGrid,
  Loader2,
  StickyNote,
  Circle,
  Square,
  ArrowRight,
  Type,
  Image as ImageIcon
} from 'lucide-react'

// Data structure for tracking individual board elements
interface MiroBoardElement {
  id: string
  type: 'sticky_note' | 'shape' | 'connector' | 'text' | 'image'
  position: { x: number; y: number }
  content?: string
  style?: {
    color?: string
    backgroundColor?: string
    fontSize?: number
    width?: number
    height?: number
  }
  metadata?: {
    shape?: 'rectangle' | 'circle' | 'triangle'
    from?: string // for connectors
    to?: string   // for connectors
  }
  miroItemId?: string // ID from actual Miro API
  createdAt: number
  updatedAt: number
}

interface MiroBoardData {
  boardId: string | null
  boardUrl: string | null
  embedHtml: string | null
  elements: MiroBoardElement[]
  lastUpdated: number
  sessionId?: string
}

const defaultMiroBoardData: MiroBoardData = {
  boardId: null,
  boardUrl: null,
  embedHtml: null,
  elements: [],
  lastUpdated: 0
}

// Custom title generator
const generateMiroBoardTitle = (data: MiroBoardData): string => {
  const elementCount = data.elements.length
  if (elementCount === 0) {
    return data.boardId ? 'Miro Board' : 'No Board'
  }
  return `Miro Board (${elementCount} element${elementCount === 1 ? '' : 's'})`
}

// Element type icons for stats
const getElementIcon = (type: MiroBoardElement['type']) => {
  switch (type) {
    case 'sticky_note': return <StickyNote className="w-4 h-4" />
    case 'shape': return <Square className="w-4 h-4" />
    case 'connector': return <ArrowRight className="w-4 h-4" />
    case 'text': return <Type className="w-4 h-4" />
    case 'image': return <ImageIcon className="w-4 h-4" />
    default: return <Circle className="w-4 h-4" />
  }
}

export function MiroPanel() {
  const { currentSession: chatSession } = useChatStore()
  const { isAuthenticated, user, signIn } = useMiro()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const embedContainerRef = useRef<HTMLDivElement>(null)
  
  const {
    data,
    save,
    clear,
    updateTitle,
  } = usePanelData<MiroBoardData>({
    storeName: 'miro-panel',
    defaultData: defaultMiroBoardData,
    titleGenerator: generateMiroBoardTitle,
    sessionKey: chatSession?.id,
  })

  // Debug the data changes and sync to real Miro board
  useEffect(() => {
    console.log('[MIRO_DEBUG] Miro panel data changed:', data);
    syncElementsToMiroBoard()
  }, [data])

  // Register this panel type so it can be accessed by the agent
  useEffect(() => {
    if (chatSession?.id) {
      console.log('[MIRO_DEBUG] Registering miro-panel for session:', chatSession.id);
      const { storeCache } = require('@/hooks/use-panel-data')
      const effectiveStoreName = `miro-panel-${chatSession.id}`
      console.log('[MIRO_DEBUG] Effective store name:', effectiveStoreName);
      console.log('[MIRO_DEBUG] Store exists in cache:', storeCache.has(effectiveStoreName));
      
      registerPanel(
        'miro-panel',
        'miro-panel',
        () => {
          const store = storeCache.get(effectiveStoreName);
          console.log('[MIRO_DEBUG] getStore called, returning:', !!store);
          return store;
        },
        'Interactive Miro board with individual elements for the current chat conversation'
      )
      console.log('[MIRO_DEBUG] Panel registration completed');
    }
  }, [chatSession?.id])

  // Sync board contents from Miro API
  const syncBoardContents = useCallback(async () => {
    if (!data.boardId || !isAuthenticated) return
    
    try {
      console.log('[MIRO_SYNC] Syncing board contents from Miro API for board:', data.boardId)
      const response = await fetch(`/api/miro/boards/${data.boardId}/items`)
      
      if (!response.ok) {
        console.error('[MIRO_SYNC] Failed to fetch board items:', response.status)
        return
      }
      
      const boardData = await response.json()
      console.log('[MIRO_SYNC] Fetched board data:', boardData)
      
      // Update our local data with the synced elements
      const syncedData: MiroBoardData = {
        ...data,
        elements: boardData.items || [],
        lastUpdated: Date.now()
      }
      
      save(syncedData)
      console.log('[MIRO_SYNC] Board contents synced successfully, elements count:', boardData.items?.length || 0)
    } catch (err) {
      console.error('[MIRO_SYNC] Error syncing board contents:', err)
    }
  }, [data, isAuthenticated, save])

  // Initialize board when component mounts or session changes
  useEffect(() => {
    if (isAuthenticated && chatSession && !data.boardId && !isLoading) {
      initializeBoard()
    }
  }, [isAuthenticated, chatSession?.id, data.boardId])

  // Sync board contents from Miro API when board is available
  useEffect(() => {
    if (data.boardId && isAuthenticated) {
      syncBoardContents()
    }
  }, [data.boardId, isAuthenticated])

  // Periodic sync every 30 seconds when board is active
  useEffect(() => {
    if (!data.boardId || !isAuthenticated) return

    const interval = setInterval(() => {
      syncBoardContents()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [data.boardId, isAuthenticated, syncBoardContents])

  // Update embed HTML when it changes
  useEffect(() => {
    if (embedContainerRef.current) {
      if (data.embedHtml && !isLoading) {
        embedContainerRef.current.innerHTML = data.embedHtml
      } else {
        embedContainerRef.current.innerHTML = ''
      }
    }
  }, [data.embedHtml, isLoading])

  const initializeBoard = useCallback(async () => {
    if (!isAuthenticated || !chatSession) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Create a new board for this session if needed
      const boardName = `Chat Session: ${chatSession.id.slice(0, 8)}`
      const response = await fetch('/api/miro/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: boardName,
          description: `Miro board for chat session ${chatSession.id}`,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create board')
      }
      
      const newBoard = await response.json()
      
      // Get embed HTML using oEmbed API
      const embedResponse = await fetch(`/api/miro/embed/${newBoard.id}`)
      if (!embedResponse.ok) {
        throw new Error('Failed to get embed HTML')
      }
      
      const embedData = await embedResponse.json()
      
      const newData: MiroBoardData = {
        ...data,
        boardId: newBoard.id,
        boardUrl: newBoard.viewLink,
        embedHtml: embedData.html,
        sessionId: chatSession.id,
        lastUpdated: Date.now()
      }
      
      save(newData)
      updateTitle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize board')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, chatSession, data, save, updateTitle])

  const syncElementsToMiroBoard = useCallback(async () => {
    if (!data.boardId || !data.elements.length) {
      console.log('[MIRO_DEBUG] Skipping sync - no boardId or elements')
      return
    }

    console.log('[MIRO_DEBUG] Syncing elements to real Miro board')
    
    // Find elements that don't have miroItemId (need to be created)
    const newElements = data.elements.filter((el: MiroBoardElement) => !el.miroItemId)
    console.log('[MIRO_DEBUG] New elements to sync:', newElements.length)
    
    for (const element of newElements) {
      try {
        let miroItem = null
        
        switch (element.type) {
          case 'sticky_note':
            console.log('[MIRO_DEBUG] Creating sticky note:', element.content)
            miroItem = await createMiroStickyNote(element)
            break
          case 'shape':
            console.log('[MIRO_DEBUG] Creating shape:', element.metadata?.shape, element.content)
            miroItem = await createMiroShape(element)
            break
          case 'text':
            console.log('[MIRO_DEBUG] Creating text:', element.content)
            miroItem = await createMiroText(element)
            break
          case 'connector':
            console.log('[MIRO_DEBUG] Creating connector from', element.metadata?.from, 'to', element.metadata?.to)
            miroItem = await createMiroConnector(element)
            break
        }
        
        if (miroItem && miroItem.success) {
          console.log('[MIRO_DEBUG] Successfully created Miro item:', miroItem.id)
          // Update our local data with the Miro item ID
          const updatedElements = data.elements.map((el: MiroBoardElement) => 
            el.id === element.id ? { ...el, miroItemId: miroItem.id } : el
          )
          
          save({
            ...data,
            elements: updatedElements,
            lastUpdated: Date.now()
          })
        }
      } catch (error) {
        console.error('[MIRO_DEBUG] Failed to create Miro element:', error)
      }
    }
  }, [data, save])

  const createMiroStickyNote = async (element: MiroBoardElement) => {
    console.log('[MIRO_DEBUG] Calling API to create sticky note')
    const response = await fetch(`/api/miro/boards/${data.boardId}/sticky-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: element.content || '',
        position: element.position,
        style: element.style
      })
    })
    
    if (!response.ok) {
      console.error('[MIRO_DEBUG] API call failed:', response.status, response.statusText)
      throw new Error(`Failed to create sticky note: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('[MIRO_DEBUG] API response:', result)
    return result
  }

  const createMiroShape = async (element: MiroBoardElement) => {
    console.log('[MIRO_DEBUG] Calling API to create shape')
    const response = await fetch(`/api/miro/boards/${data.boardId}/shapes`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shape: element.metadata?.shape || 'rectangle',
        content: element.content || '',
        position: element.position,
        style: element.style
      })
    })
    
    if (!response.ok) {
      console.error('[MIRO_DEBUG] Shape API call failed:', response.status, response.statusText)
      throw new Error(`Failed to create shape: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('[MIRO_DEBUG] Shape API response:', result)
    return result
  }

  const createMiroText = async (element: MiroBoardElement) => {
    console.log('[MIRO_DEBUG] Calling API to create text')
    const response = await fetch(`/api/miro/boards/${data.boardId}/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: element.content || '',
        position: element.position,
        style: element.style
      })
    })
    
    if (!response.ok) {
      console.error('[MIRO_DEBUG] Text API call failed:', response.status, response.statusText)
      throw new Error(`Failed to create text: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('[MIRO_DEBUG] Text API response:', result)
    return result
  }

  const createMiroConnector = async (element: MiroBoardElement) => {
    console.log('[MIRO_DEBUG] Calling API to create connector')
    const response = await fetch(`/api/miro/boards/${data.boardId}/connectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: element.metadata?.from,
        to: element.metadata?.to,
        style: element.style
      })
    })
    
    if (!response.ok) {
      console.error('[MIRO_DEBUG] Connector API call failed:', response.status, response.statusText)
      throw new Error(`Failed to create connector: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('[MIRO_DEBUG] Connector API response:', result)
    return result
  }

  const handleRefreshBoard = useCallback(() => {
    if (data.boardId) {
      console.log('[MIRO_DEBUG] Refreshing board:', data.boardId)
      // Sync contents from Miro API first
      syncBoardContents()
      // Then sync our local elements to Miro
      // syncElementsToMiroBoard()
    }
  }, [data.boardId, syncBoardContents, syncElementsToMiroBoard])

  if (!chatSession) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Start a chat to access Miro board
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <LayoutGrid className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Miro</h3>
        <p className="text-sm text-gray-500 mb-4">
          Connect your Miro account to create and manage a board for this chat.
        </p>
        <Button onClick={signIn} className="mb-2">
          <ExternalLink className="h-4 w-4 mr-2" />
          Connect to Miro
        </Button>
        <p className="text-xs text-gray-400">
          You'll be redirected to authorize this app
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex justify-between items-center gap-2 p-2 border-b bg-gray-50">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshBoard}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title="Refresh Board"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {data.boardUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(data.boardUrl, '_blank')}
              className="h-8 w-8 p-0"
              title="Open in Miro"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">
            {data.elements.length} element{data.elements.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-shrink-0 p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Real Miro Board Embed */}
      <div className="flex-1 min-h-0">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Setting up Miro board...</p>
          </div>
        )}
        
        {!isLoading && data.embedHtml && (
          <div 
            ref={embedContainerRef}
            className="h-full w-full"
          />
        )}
        
        {!isLoading && !data.embedHtml && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <LayoutGrid className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 mb-3">
              No board found for this chat session.
            </p>
            <Button onClick={initializeBoard} disabled={isLoading} size="sm">
              Create Board
            </Button>
          </div>
        )}
      </div>

      {/* Element Summary */}
      {data.elements.length > 0 && (
        <div className="flex-shrink-0 border-t bg-blue-50 p-2">
          <div className="flex flex-wrap gap-1">
            {['sticky_note', 'shape', 'connector', 'text', 'image'].map(type => {
              const count = data.elements.filter((el: MiroBoardElement) => el.type === type).length
              if (count === 0) return null
              return (
                <Badge key={type} variant="secondary" className="text-xs">
                  {getElementIcon(type as any)}
                  <span className="ml-1">{count}</span>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Board Info */}
      {data.boardId && (
        <div className="flex-shrink-0 border-t bg-gray-100 p-2">
          <p className="text-xs text-gray-600">
            <strong>Board ID:</strong> {data.boardId} • 
            <strong> Session:</strong> {chatSession.id.slice(0, 8)}
          </p>
        </div>
      )}
    </div>
  )
} 