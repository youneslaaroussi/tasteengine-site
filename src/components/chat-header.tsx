'use client';

import { Button } from '@/components/ui/button';
import { Plane, Plus, LogIn, UserPlus } from 'lucide-react';
import { LoginModal, SignupModal } from './auth-modals';

interface ChatHeaderProps {
  onNewChat: () => void;
}

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Travel Assistant</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <LoginModal>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </LoginModal>
          
          <SignupModal>
            <Button variant="default" size="sm" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Sign Up
            </Button>
          </SignupModal>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            onClick={onNewChat}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
      </div>
    </header>
  );
} 