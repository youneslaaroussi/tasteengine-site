'use client'

import { MessageSquare } from 'lucide-react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChatHistorySidebar } from '@/components/chat-history'
import { useChatStore } from '@/stores/chat-store'
import { TextPanel } from '@/components/panels/text-panel'
import { Mosaic, MosaicWindow } from 'react-mosaic-component'
import { useState } from 'react'

// Import the required CSS for react-mosaic
import 'react-mosaic-component/react-mosaic-component.css'

type ViewId = 'chat' | 'notes'

const TITLE_MAP: Record<ViewId, string> = {
  chat: 'Chat',
  notes: 'Notes',
}

interface ChatLayoutWithHistoryProps {
  children: React.ReactNode
}

export function ChatLayoutWithHistory({ children }: ChatLayoutWithHistoryProps) {
  const isMobile = useIsMobile()
  
  // Initial mosaic layout - chat takes 70% width, notes takes 30%
  const [mosaicValue, setMosaicValue] = useState<any>({
    direction: 'row' as const,
    first: 'chat' as ViewId,
    second: 'notes' as ViewId,
    splitPercentage: 70,
  })

  const handleMosaicChange = (value: any) => {
    setMosaicValue(value)
  }

  const renderTile = (id: ViewId, path: any) => {
    if (id === 'chat') {
      return (
        <MosaicWindow<ViewId>
          path={path}
          title={TITLE_MAP[id]}
          createNode={() => 'notes'}
          className="bg-white"
        >
          <div className="h-full bg-white">
            <div className="w-full mx-auto h-full">
              {children}
            </div>
          </div>
        </MosaicWindow>
      )
    }

    if (id === 'notes') {
      return (
        <MosaicWindow<ViewId>
          path={path}
          title={TITLE_MAP[id]}
          createNode={() => 'chat'}
          className="bg-white"
        >
          <div className="h-full">
            <TextPanel />
          </div>
        </MosaicWindow>
      )
    }

    return null
  }

  // For mobile, fallback to original layout
  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="flex h-dvh w-full">
          {/* Sidebar for both mobile and desktop */}
          <ChatHistorySidebar />
          
          {/* Main content area */}
          <SidebarInset className="flex-1">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-semibold">GoFlyTo</span>
                </div>
              </div>
              
              {/* Main content */}
              <div className="flex-1 flex gap-4 p-4 min-h-0">
                {/* Chat Interface */}
                <div className="flex-1 min-w-0">
                  <div className="w-full mx-auto h-full">
                    {children}
                  </div>
                </div>
                
                {/* Text Panel */}
                <div className="w-80 flex-shrink-0">
                  <TextPanel />
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full">
        {/* Sidebar for both mobile and desktop */}
        <ChatHistorySidebar />
        
        {/* Main content area */}
        <SidebarInset className="flex-1">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-semibold">GoFlyTo</span>
              </div>
            </div>
            
            {/* Mosaic Layout */}
            <div className="flex-1 min-h-0 p-4">
              <div className="h-full w-full">
                <Mosaic<ViewId>
                  renderTile={renderTile}
                  value={mosaicValue}
                  onChange={handleMosaicChange}
                  className="mosaic-blueprint-theme"
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* Custom styles to integrate mosaic with Tailwind */}
      <style jsx global>{`
        .mosaic-root {
          height: 100%;
          width: 100%;
        }
        
        .mosaic-tile {
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
        
        .mosaic-window-toolbar {
          background-color: rgb(249 250 251);
          border-bottom: 1px solid rgb(229 231 235);
          color: rgb(55 65 81);
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .mosaic-window-title {
          color: rgb(55 65 81);
          font-weight: 600;
        }
        
        .mosaic-window-body {
          background-color: white;
          height: calc(100% - 30px);
        }
        
        .mosaic-split.-row {
          background-color: rgb(229 231 235);
        }
        
        .mosaic-split.-column {
          background-color: rgb(229 231 235);
        }
        
        .mosaic-drop-target {
          border: 2px dashed rgb(59 130 246);
          background-color: rgb(59 130 246 / 0.1);
        }
        
        .mosaic-drop-target.drop-target-hover {
          background-color: rgb(59 130 246 / 0.2);
        }
      `}</style>
    </SidebarProvider>
  )
} 