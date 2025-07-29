'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePanelData } from '@/hooks/use-panel-data'
import { useChatStore } from '@/stores/chat-store'
import { useMiro } from '@/contexts/miro-context'
import { registerPanel } from '@/lib/panel-context'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  RefreshCw,
  LayoutGrid,
  Loader2
} from 'lucide-react'

interface SessionBoardData {
  boardId: string | null
  boardUrl: string | null
  embedHtml: string | null
  lastUpdated: number
}

const defaultSessionBoardData: SessionBoardData = {
  boardId: null,
  boardUrl: null,
  embedHtml: null,
  lastUpdated: 0
}

// Custom title generator for session board data
const generateSessionBoardTitle = (data: SessionBoardData): string => {
  return data.boardId ? 'Miro Board' : 'No Board'
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
  } = usePanelData<SessionBoardData>({
    storeName: 'miro-panel',
    defaultData: defaultSessionBoardData,
    titleGenerator: generateSessionBoardTitle,
    sessionKey: chatSession?.id,
  })

  // Register this panel type so it can be accessed by the agent
  useEffect(() => {
    if (chatSession?.id) {
      const { storeCache } = require('@/hooks/use-panel-data')
      const effectiveStoreName = `miro-panel-${chatSession.id}`
      
      registerPanel(
        'miro',
        'miro-panel',
        () => storeCache.get(effectiveStoreName),
        'Embedded Miro board for the current chat conversation'
      )
    }
  }, [chatSession?.id])

  // Get or create board for current session
  const getOrCreateSessionBoard = useCallback(async () => {
    if (!isAuthenticated || !chatSession) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if we already have a board for this session
      if (data.boardId && data.embedHtml) {
        console.log('Using existing board for session:', chatSession.id)
        setIsLoading(false)
        return
      }

      // Create a new board for this session
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
      console.log('Created new board:', newBoard.id)
      
      // Get embed HTML using oEmbed API
      const embedResponse = await fetch(`/api/miro/embed/${newBoard.id}`)
      if (!embedResponse.ok) {
        throw new Error('Failed to get embed HTML')
      }
      
      const embedData = await embedResponse.json()
      
      const newData: SessionBoardData = {
        boardId: newBoard.id,
        boardUrl: newBoard.viewLink,
        embedHtml: embedData.html,
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

  // Initialize board when component mounts or session changes
  useEffect(() => {
    if (isAuthenticated && chatSession && !data.boardId && !isLoading) {
      getOrCreateSessionBoard()
    }
  }, [isAuthenticated, chatSession?.id, data.boardId])

  // Update embed HTML only when it changes to prevent iframe recreation
  useEffect(() => {
    if (embedContainerRef.current) {
      if (data.embedHtml && !isLoading) {
        embedContainerRef.current.innerHTML = data.embedHtml
      } else {
        // Clear embed container when loading or no embed HTML
        embedContainerRef.current.innerHTML = ''
      }
    }
  }, [data.embedHtml, isLoading])

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
          Connect your Miro account to create and embed a board for this chat.
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
            onClick={getOrCreateSessionBoard}
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

        <div className="text-xs text-gray-500">
          {data.boardId ? 'Board Ready' : 'No Board'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-shrink-0 p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Board Embed */}
      <div className="flex-1 min-h-0">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Initializing Miro board...</p>
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
            <Button onClick={getOrCreateSessionBoard} disabled={isLoading} size="sm">
              Create Board
            </Button>
          </div>
        )}
      </div>

      {/* Board Info */}
      {data.boardId && (
        <div className="flex-shrink-0 border-t bg-blue-50 p-2">
          <p className="text-xs text-blue-700">
            <strong>Session Board:</strong> Chat {chatSession.id.slice(0, 8)}
          </p>
        </div>
      )}
    </div>
  )
} 