'use client'

import { useState } from 'react'
import { useEruda, useDebugMode } from '@/hooks/use-eruda'

interface DebugPanelProps {
  /**
   * Whether to show the debug panel
   * By default, only shows in development or when debug mode is active
   */
  show?: boolean
  
  /**
   * Position of the debug panel
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  
  /**
   * Whether the panel should be collapsible
   */
  collapsible?: boolean
}

export function DebugPanel({ 
  show, 
  position = 'bottom-right',
  collapsible = true 
}: DebugPanelProps) {
  const { isEnabled, toggle } = useEruda()
  const isDebugMode = useDebugMode()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Only show if explicitly requested or in debug mode
  const shouldShow = show ?? isDebugMode

  if (!shouldShow) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-[9999998] bg-black/80 text-white rounded-lg shadow-lg border border-gray-600 backdrop-blur-sm`}
      style={{ fontFamily: 'monospace', fontSize: '12px' }}
    >
      {collapsible && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-3 py-2 text-left hover:bg-white/10 rounded-t-lg flex items-center justify-between"
        >
          <span>🔧 Debug</span>
          <span className="text-xs">{isCollapsed ? '▼' : '▲'}</span>
        </button>
      )}
      
      {!isCollapsed && (
        <div className="p-3 space-y-2 min-w-[200px]">
          <div className="text-xs text-gray-300 mb-2">
            Environment: <span className="text-green-400">{process.env.NODE_ENV}</span>
          </div>
          
          <button
            onClick={toggle}
            className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
              isEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isEnabled ? '✅ Eruda Enabled' : '❌ Enable Eruda'}
          </button>
          
          <div className="text-xs text-gray-400 space-y-1">
            <div>💡 Tips:</div>
            <div>• Add ?debug=true to URL</div>
            <div>• Use Ctrl/Cmd+Shift+D</div>
            <div>• Persistent across sessions</div>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-600">
            <div>URL: ?debug=true|false</div>
            <div>Storage: eruda-enabled</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Optional: Export a simple toggle button for minimal UI
export function ErudaToggleButton({ 
  className = "fixed bottom-4 left-4 z-[9999998] bg-black/80 text-white p-2 rounded-full hover:bg-black/90 transition-colors" 
}: { 
  className?: string 
}) {
  const { isEnabled, toggle } = useEruda()
  const isDebugMode = useDebugMode()

  if (!isDebugMode) return null

  return (
    <button
      onClick={toggle}
      className={className}
      title={isEnabled ? 'Disable Eruda' : 'Enable Eruda'}
    >
      {isEnabled ? '🔧' : '🛠️'}
    </button>
  )
}