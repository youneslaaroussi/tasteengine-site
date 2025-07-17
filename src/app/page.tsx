'use client';

import { ChatInterface, ChatInterfaceRef } from '@/components/chat-interface';
import { ChatHeader } from '@/components/chat-header';
import { ChatHistorySidebar } from '@/components/chat-history-sidebar';
import { ChatSession } from '@/types/chat-history';
import { useRef, useEffect, useState } from 'react';

export default function Home() {
  const chatRef = useRef<ChatInterfaceRef>(null);
  const [isMobile, setIsMobile] = useState(false);

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

  const handleNewChat = () => {
    chatRef.current?.resetChat();
  };

  const handleLoadSession = (session: ChatSession) => {
    chatRef.current?.loadSession(session);
  };

  // Mobile layout - sidebar in header
  if (isMobile) {
    return (
      <main className="h-dvh bg-white flex flex-col">
        <ChatHeader onNewChat={handleNewChat} onLoadSession={handleLoadSession} />
        <div className="flex-1 overflow-hidden">
          <ChatInterface ref={chatRef} />
        </div>
      </main>
    );
  }

  // Desktop layout - sidebar alongside content
  return (
    <main className="h-dvh bg-white flex flex-col">
      <ChatHeader onNewChat={handleNewChat} onLoadSession={handleLoadSession} />
      <div className="flex-1 overflow-hidden flex">
        <ChatHistorySidebar onNewChat={handleNewChat} onLoadSession={handleLoadSession} />
        <div className="flex-1 overflow-hidden">
          <ChatInterface ref={chatRef} />
        </div>
      </div>
    </main>
  );
}
