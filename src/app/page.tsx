'use client';

import { ChatInterface, ChatInterfaceRef } from '@/components/chat-interface';
import { ChatHeader } from '@/components/chat-header';
import { useRef } from 'react';

export default function Home() {
  const chatRef = useRef<ChatInterfaceRef>(null);

  const handleNewChat = () => {
    chatRef.current?.resetChat();
  };

  return (
    <main className="h-screen bg-white flex flex-col">
      <ChatHeader onNewChat={handleNewChat} />
      <div className="flex-1 overflow-hidden">
        <ChatInterface ref={chatRef} />
      </div>
    </main>
  );
}
