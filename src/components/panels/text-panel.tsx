'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePanelData } from '@/hooks/use-panel-data'
import { useChatStore } from '@/stores/chat-store'
import { registerPanel } from '@/lib/panel-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Save, 
  Clock, 
  RefreshCw 
} from 'lucide-react'
import { format } from 'date-fns'

interface TextData {
  title: string
  content: string
}

const defaultTextData: TextData = {
  title: '',
  content: ''
}

// Custom title generator for text data
const generateTextTitle = (data: TextData): string => {
  if (data.title.trim()) {
    return data.title.slice(0, 50) + (data.title.length > 50 ? '...' : '')
  }
  if (data.content.trim()) {
    // Take first line or first 50 characters of content
    const firstLine = data.content.split('\n')[0]
    return firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '')
  }
  return 'Untitled Note'
}

export function TextPanel() {
  // Get current chat session to tie text notes to it
  const { currentSession: chatSession, isLoading: chatLoading } = useChatStore()
  
  const {
    data,
    currentSession,
    save,
    clear,
    updateTitle,
  } = usePanelData<TextData>({
    storeName: 'text-panel',
    defaultData: defaultTextData,
    titleGenerator: generateTextTitle,
    sessionKey: chatSession?.id, // This ties the text panel to the current chat session
  })

  // Register this panel type so it can be accessed by the agent
  useEffect(() => {
    if (chatSession?.id) {
      const { storeCache } = require('@/hooks/use-panel-data')
      const effectiveStoreName = `text-panel-${chatSession.id}`
      
      registerPanel(
        'notes',
        'text-panel',
        () => storeCache.get(effectiveStoreName),
        'Text notes associated with the current chat conversation'
      )
      
      console.log('[TextPanel] Registered notes panel for session:', chatSession.id)
    }
  }, [chatSession?.id])

  const [localTitle, setLocalTitle] = useState(data.title)
  const [localContent, setLocalContent] = useState(data.content)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update local state when data changes (from loading different sessions)
  useEffect(() => {
    setLocalTitle(data.title)
    setLocalContent(data.content)
    setHasUnsavedChanges(false)
  }, [data])

  // Track changes to show unsaved indicator
  useEffect(() => {
    const hasChanges = localTitle !== data.title || localContent !== data.content
    setHasUnsavedChanges(hasChanges)
  }, [localTitle, localContent, data])

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => clearTimeout(timer)
  }, [localTitle, localContent, hasUnsavedChanges])

  const handleSave = useCallback(() => {
    const newData: TextData = {
      title: localTitle,
      content: localContent,
    }
    save(newData)
    
    // Auto-generate title if it's empty
    if (!localTitle.trim() && localContent.trim()) {
      updateTitle()
    }
  }, [localTitle, localContent, save, updateTitle])

  const handleClear = useCallback(() => {
    setLocalTitle('')
    setLocalContent('')
    clear(defaultTextData)
  }, [clear])

  // Show message if no chat session is active
  if (!chatSession) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Chat Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a chat to take notes</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Chat Notes</span>
            {chatLoading && (
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Agent responding...
              </Badge>
            )}
            {!chatLoading && hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Unsaved
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges || chatLoading}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} disabled={chatLoading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex-shrink-0 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Notes for: <span className="font-medium">{chatSession.title}</span>
        </div>

        {/* Title Input */}
        <div className="flex-shrink-0">
          <Input
            placeholder="Note title..."
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="font-medium"
            disabled={chatLoading}
          />
        </div>

        {/* Content Input */}
        <div className="flex-1 min-h-0">
          <Textarea
            placeholder="Take notes about this chat..."
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            className="h-full resize-none"
            disabled={chatLoading}
          />
        </div>

        {/* Status Bar */}
        <div className="flex-shrink-0 text-xs text-gray-500 flex justify-between">
          <span>{localContent.length} characters</span>
          {currentSession && (
            <span>
              Last saved: {format(new Date(currentSession.updatedAt), 'MMM d, HH:mm')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 