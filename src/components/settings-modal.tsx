'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, ExternalLink, CheckCircle, XCircle, Loader2, X } from 'lucide-react'
import { useMiro } from '@/contexts/miro-context'

interface SettingsModalProps {
  children: React.ReactNode
}

export function SettingsModal({ children }: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, isLoading, signIn, signOut } = useMiro()

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in-0 duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-white rounded-lg border shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Settings</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Miro Integration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Miro</h3>
                  <p className="text-xs text-gray-500">
                    Create and manage boards
                  </p>
                </div>
                
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500">Checking...</p>
                </div>
              ) : isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-md border border-green-100">
                    <p className="text-sm text-green-800 font-medium">{user.name}</p>
                    <p className="text-xs text-green-600">{user.email}</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={signOut}
                    className="w-full h-8 text-xs"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={signIn}
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Connect
                </Button>
              )}
            </div>

            {/* Future integrations placeholder */}
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 text-center">
                More integrations coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 