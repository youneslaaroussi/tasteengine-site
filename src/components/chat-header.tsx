'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plane, Plus, LogIn, UserPlus, Menu } from 'lucide-react';
import { LoginModal, SignupModal } from './auth-modals';
import { CountrySelector } from './country-selector';
import { CountryPreloader } from './country-preloader';
import { ChatHistorySidebar } from './chat-history-sidebar';
import { ChatSession } from '@/types/chat-history';
import { trackNavigationEvent, trackUserEngagement } from '@/lib/gtag';

import Image from 'next/image';
import logo from '@/assets/app-logo.png';

interface ChatHeaderProps {
  onNewChat: () => void;
  onLoadSession: (session: ChatSession) => void;
}

export function ChatHeader({ onNewChat, onLoadSession }: ChatHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    trackNavigationEvent('new_chat_click', 'header');
    onNewChat();
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <CountryPreloader />
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          {isMobile && <ChatHistorySidebar onNewChat={onNewChat} onLoadSession={onLoadSession} />}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
            <Image src={logo} alt="GoFlyTo" width={64} height={64} />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            <span className="hidden sm:inline">Travel Assistant</span>
            <span className="sm:hidden">Travel</span>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
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

          <CountrySelector />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            onClick={() => {
              trackNavigationEvent('new_chat_click', 'header_mobile');
              onNewChat();
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>

          <Sheet open={isMenuOpen} onOpenChange={(open) => {
            setIsMenuOpen(open);
            trackUserEngagement(open ? 'mobile_menu_open' : 'mobile_menu_close', 'header');
          }}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px]">
              <SheetHeader className="pb-6">
                <SheetTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  Travel Assistant
                </SheetTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Your AI-powered travel planning companion
                </p>
              </SheetHeader>

              <div className="flex flex-col space-y-6 px-4">
                {/* Account Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 px-3">
                    Account
                  </h3>
                  <div className="space-y-2">
                    <LoginModal onOpenChange={(open) => !open && setIsMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start flex items-center gap-3 h-11 px-3 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center">
                          <LogIn className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">Sign In</span>
                          <span className="text-xs text-gray-500">Access your account</span>
                        </div>
                      </Button>
                    </LoginModal>

                    <SignupModal onOpenChange={(open) => !open && setIsMenuOpen(false)}>
                      <Button
                        variant="default"
                        className="w-full justify-start flex items-center gap-3 h-11 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">Sign Up</span>
                          <span className="text-xs text-blue-100">Create new account</span>
                        </div>
                      </Button>
                    </SignupModal>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Settings Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 px-3">
                    Settings
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center">
                          <Plane className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">Country</span>
                          <span className="text-xs text-gray-500">For personalized results</span>
                        </div>
                      </div>
                      <CountrySelector />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Actions Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 px-3">
                    Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      onClick={handleNewChat}
                      variant="outline"
                      className="w-full justify-start flex items-center gap-3 h-11 px-3 hover:bg-gray-50 border-gray-200 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center">
                        <Plus className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">New Chat</span>
                        <span className="text-xs text-gray-500">Start fresh conversation</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 