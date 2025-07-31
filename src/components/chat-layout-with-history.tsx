'use client'

import { MessageSquare, Settings, Brain } from 'lucide-react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChatHistorySidebar } from '@/components/chat-history'
import { useChatStore } from '@/stores/chat-store'
import { TextPanel } from '@/components/panels/text-panel'
import { MapPanel } from '@/components/panels/map-panel'
import { MiroPanel } from '@/components/panels/miro-panel'
import { QlooPanel } from '@/components/panels/qloo-panel'
import { SettingsModal } from '@/components/settings-modal'
import { FlowView } from '@/components/flow-view'
import { Mosaic, MosaicWindow } from 'react-mosaic-component'
import { useState, useEffect } from 'react'
import Image from 'next/image'

// Import the required CSS for react-mosaic
import 'react-mosaic-component/react-mosaic-component.css'

type ViewId = 'campaign' | 'notes' | 'map' | 'miro' | 'qloo'
type ViewMode = 'campaign' | 'brain'

const TITLE_MAP: Record<ViewId, string> = {
  campaign: 'Campaign Intelligence',
  notes: 'Strategic Notes',
  map: 'Geographic Intelligence',
  miro: 'Collaborative Canvas',
  qloo: 'Cultural Intelligence',
}

interface ChatLayoutWithHistoryProps {
  children: React.ReactNode
}

export function ChatLayoutWithHistory({ children }: ChatLayoutWithHistoryProps) {
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = useState<ViewMode>('campaign')
  const { sessions, loadDefaultChat } = useChatStore()
  
  // Load default chat on first visit
  useEffect(() => {
    if (sessions.length === 0) {
      loadDefaultChat()
    }
  }, [sessions.length, loadDefaultChat])
  
  // Initial mosaic layout - campaign takes 40% width, panels split the remaining 60%
  const [mosaicValue, setMosaicValue] = useState<any>({
    direction: 'row' as const,
    first: 'campaign' as ViewId,
    second: {
      direction: 'row' as const,
      first: {
        direction: 'column' as const,
        first: 'map' as ViewId,
        second: 'miro' as ViewId,
        splitPercentage: 50,
      },
      second: {
        direction: 'column' as const,
        first: 'notes' as ViewId,
        second: 'qloo' as ViewId,
        splitPercentage: 50,
      },
      splitPercentage: 50,
    },
    splitPercentage: 40,
  })

  const handleMosaicChange = (value: any) => {
    setMosaicValue(value)
  }

  const renderTile = (id: ViewId, path: any) => {
    if (id === 'campaign') {
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
          createNode={() => 'map'}
          className="bg-white"
        >
          <div className="h-full">
            <TextPanel />
          </div>
        </MosaicWindow>
      )
    }

    if (id === 'map') {
      return (
        <MosaicWindow<ViewId>
          path={path}
          title={TITLE_MAP[id]}
          createNode={() => 'miro'}
          className="bg-white"
        >
          <div className="h-full">
            <MapPanel />
          </div>
        </MosaicWindow>
      )
    }

    if (id === 'miro') {
      return (
        <MosaicWindow<ViewId>
          path={path}
          title={TITLE_MAP[id]}
          createNode={() => 'campaign'}
          className="bg-white"
        >
          <div className="h-full">
            <MiroPanel />
          </div>
        </MosaicWindow>
      )
    }

    if (id === 'qloo') {
      return (
        <MosaicWindow<ViewId>
          path={path}
          title={TITLE_MAP[id]}
          createNode={() => 'notes'}
          className="bg-white"
        >
          <div className="h-full">
            <QlooPanel />
          </div>
        </MosaicWindow>
      )
    }

    return null
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
                <div className="flex items-center gap-2">
                  <Image src="/logotype.png" alt="TasteEngine" className="h-10 w-40" width={256} height={256} />
                  <div className="h-6 w-px bg-gray-300" />
                  <Image src="/qloo.png" alt="Powered by Qloo" width={80} height={12} className="h-full" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center rounded-lg border p-1">
                  <Button
                    variant={viewMode === 'campaign' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('campaign')}
                    className="h-7 px-3 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Campaign
                  </Button>
                  <Button
                    variant={viewMode === 'brain' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('brain')}
                    className="h-7 px-3 text-xs"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Intelligence Brain
                  </Button>
                </div>
                
                <SettingsModal>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SettingsModal>
              </div>
            </div>
            
            {/* Content based on view mode */}
            {viewMode === 'campaign' ? (
              /* Mosaic Layout */
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
            ) : (
              /* Intelligence Brain View */
              <div className="flex-1 min-h-0 p-4">
                <FlowView className="h-full" />
              </div>
            )}
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