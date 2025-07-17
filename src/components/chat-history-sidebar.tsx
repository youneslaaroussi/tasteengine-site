'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Trash2, 
  Plus, 
  History,
  AlertTriangle, 
  HistoryIcon
} from 'lucide-react';
import { useChatHistory } from '@/hooks/use-chat-history';
import { ChatSession } from '@/types/chat-history';
import { trackChatHistoryEvent, trackUserEngagement } from '@/lib/gtag';

interface ChatHistorySidebarProps {
  onNewChat: () => void;
  onLoadSession: (session: ChatSession) => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  onNewChat,
  onLoadSession,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { sessions, currentSessionId, deleteSession, clearHistory } = useChatHistory();

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    trackChatHistoryEvent(open ? 'sidebar_open' : 'sidebar_close');
  };

  const handleSessionClick = (session: ChatSession) => {
    trackChatHistoryEvent('load_session');
    onLoadSession(session);
    setIsOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    trackUserEngagement('delete_session', 'chat_history');
    deleteSession(sessionId);
  };

  const handleNewChat = () => {
    trackChatHistoryEvent('new_chat');
    onNewChat();
    setIsOpen(false);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      clearHistory();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Shared content component
  const SidebarContent = () => (
    <div className="flex-1 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No chat history</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group p-3 cursor-pointer border-b hover:bg-gray-50 ${
                  currentSessionId === session.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSessionClick(session)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis line-clamp-2">
                      {session.title}
                    </h4>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(session.updatedAt)} • {session.messages.length} messages
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 text-gray-400 hover:text-red-600"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Clear History Button */}
      {sessions.length > 0 && (
        <div className="p-4 border-t">
          <Button
            variant="outline"
            onClick={handleClearHistory}
            className="w-full justify-start gap-2 text-red-600"
          >
            <AlertTriangle className="w-4 h-4" />
            Clear All History
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile version - sheet overlay
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <HistoryIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Chat History</span>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-full sm:max-w-sm p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg">
              Chat History
            </SheetTitle>
          </SheetHeader>
          
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version - persistent sidebar
  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-lg font-semibold">
          Chat History
        </div>
      </div>
      
      <SidebarContent />
    </div>
  );
}; 