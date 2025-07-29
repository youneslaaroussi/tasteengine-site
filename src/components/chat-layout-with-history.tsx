'use client'

import { MessageSquare, Menu } from 'lucide-react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChatHistorySidebar } from '@/components/chat-history'
import { useChatStore } from '@/stores/chat-store'
import { TextPanel } from '@/components/panels/text-panel'

interface ChatLayoutWithHistoryProps {
  children: React.ReactNode
}

export function ChatLayoutWithHistory({ children }: ChatLayoutWithHistoryProps) {
  const isMobile = useIsMobile()

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
                <div className="w-full max-w-4xl mx-auto h-full">
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