'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { usePanelData } from '@/hooks/use-panel-data'
import { useChatStore } from '@/stores/chat-store'
import { registerPanel } from '@/lib/panel-context'
import { Button } from '@/components/ui/button'
import { 
  Save, 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Quote
} from 'lucide-react'

interface TextData {
  title: string
  content: string
}

const defaultTextData: TextData = {
  title: '',
  content: '<p></p>'
}

// Custom title generator for text data
const generateTextTitle = (data: TextData): string => {
  if (data.content.trim()) {
    // Extract text content from HTML
    const textContent = data.content.replace(/<[^>]*>/g, '').trim()
    if (textContent) {
      const firstLine = textContent.split('\n')[0]
      return firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '')
    }
  }
  return 'Untitled Note'
}

export function TextPanel() {
  const { currentSession: chatSession } = useChatStore()
  
  const {
    data,
    save,
    clear,
    updateTitle,
  } = usePanelData<TextData>({
    storeName: 'text-panel',
    defaultData: defaultTextData,
    titleGenerator: generateTextTitle,
    sessionKey: chatSession?.id,
  })

  // Register this panel type so it can be accessed by the agent
  useEffect(() => {
    if (chatSession?.id) {
      const { storeCache } = require('@/hooks/use-panel-data')
      const effectiveStoreName = `text-panel-${chatSession.id}`
      
      registerPanel(
        'text-panel',
        'text-panel',
        () => storeCache.get(effectiveStoreName),
        'Text notes associated with the current chat conversation'
      )
    }
  }, [chatSession?.id])

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: data.content || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML()
      const hasChanges = newContent !== data.content
      setHasUnsavedChanges(hasChanges)
    },
  })

  // Update editor when data changes
  useEffect(() => {
    if (editor && data.content !== editor.getHTML()) {
      editor.commands.setContent(data.content || '<p></p>')
    }
    setHasUnsavedChanges(false)
  }, [data, editor])

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges || !editor) return

    const timer = setTimeout(() => {
      handleSave()
    }, 2000)

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, editor])

  const handleSave = useCallback(() => {
    if (!editor) return
    
    const newData: TextData = {
      title: generateTextTitle({ title: '', content: editor.getHTML() }),
      content: editor.getHTML(),
    }
    save(newData)
    updateTitle()
  }, [editor, save, updateTitle])

  const handleClear = useCallback(() => {
    if (editor) {
      editor.commands.setContent('<p></p>')
    }
    clear(defaultTextData)
  }, [clear, editor])

  if (!chatSession || !editor) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        {!chatSession ? 'Start a chat to take notes' : 'Loading...'}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Combined Toolbar */}
      <div className="flex-shrink-0 flex justify-between items-center gap-2 p-2 border-b bg-gray-50">
        <div className="flex gap-1">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px bg-gray-200 mx-1" />
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSave} 
          disabled={!hasUnsavedChanges}
          className="h-8 w-8 p-0"
          title="Save"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>

      {/* TipTap Editor */}
      <div className="flex-1 min-h-0">
        <EditorContent
          editor={editor}
          className="h-full prose prose-sm max-w-none p-4 focus-within:outline-none"
          style={{
            height: '100%',
            overflowY: 'auto'
          }}
        />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          height: 100%;
          min-height: 100%;
        }
        
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        
        .ProseMirror p:first-child {
          margin-top: 0;
        }
        
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        
        .ProseMirror ul, .ProseMirror ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .ProseMirror blockquote {
          border-left: 3px solid #ddd;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #666;
        }
        
        .ProseMirror strong {
          font-weight: bold;
        }
        
        .ProseMirror em {
          font-style: italic;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          content: "Take notes...";
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        
        /* Enable TipTap's built-in bubble menu and formatting */
        .ProseMirror-focused {
          outline: none;
        }
      `}</style>
    </div>
  )
} 