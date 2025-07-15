'use client';

import React, { useState } from 'react';
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

interface ChatHistorySidebarProps {
  onNewChat: () => void;
  onLoadSession: (session: ChatSession) => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  onNewChat,
  onLoadSession,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { sessions, currentSessionId, deleteSession, clearHistory } = useChatHistory();

  const handleSessionClick = (session: ChatSession) => {
    onLoadSession(session);
    setIsOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
  };

  const handleNewChat = () => {
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
            <History className="w-5 h-5" />
            Chat History
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-4 border-b">
            <Button 
              onClick={handleNewChat}
              className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Sessions List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No chat history yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start a conversation to see it here
                  </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative rounded-lg border p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      currentSessionId === session.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {session.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDate(session.updatedAt)}</span>
                          <span>•</span>
                          <span>{session.messages.length} messages</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-gray-400 hover:text-red-600"
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
                className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <AlertTriangle className="w-4 h-4" />
                Clear All History
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}; 