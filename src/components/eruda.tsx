'use client'

import { useEffect } from 'react'

interface ErudaProps {
  /**
   * Whether to force enable Eruda regardless of environment
   * Useful for testing in production-like environments
   */
  forceEnable?: boolean
  
  /**
   * Whether to enable Eruda in development mode
   * Default: true
   */
  enableInDev?: boolean
  
  /**
   * Whether to enable Eruda in production mode
   * Default: false (but can be overridden with URL parameter)
   */
  enableInProd?: boolean
  
  /**
   * URL parameter name to enable Eruda
   * Default: 'debug'
   * Usage: ?debug=true or ?debug=1
   */
  urlParam?: string
}

export function Eruda({
  forceEnable = false,
  enableInDev = true,
  enableInProd = false,
  urlParam = 'debug'
}: ErudaProps = {}) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const isDev = process.env.NODE_ENV === 'development'
    const isProd = process.env.NODE_ENV === 'production'
    
    // Check URL parameter for debug mode
    const urlParams = new URLSearchParams(window.location.search)
    const debugParam = urlParams.get(urlParam)
    const isDebugMode = debugParam === 'true' || debugParam === '1'
    
    // Check localStorage for persistent debug mode
    const persistentDebug = localStorage.getItem('eruda-enabled') === 'true'
    
    // Check environment variable configuration
    // Default to 'true' if not set (assume enabled)
    const envConfig = process.env.ERUDA_ENABLED || 'true'
    const envForceEnable = envConfig === 'true'
    const envForceDisable = envConfig === 'false'
    
    // Determine if Eruda should be enabled
    const shouldEnable = !envForceDisable && (
      envForceEnable ||
      forceEnable || 
      (isDev && enableInDev) || 
      (isProd && enableInProd) ||
      isDebugMode ||
      persistentDebug
    )

    if (shouldEnable) {
      // Dynamic import to avoid bundling Eruda in production unless needed
      import('eruda').then((eruda) => {
        eruda.default.init({
          // Configuration options
          container: document.body,
          tool: ['console', 'elements', 'network', 'resource', 'info', 'snippets', 'sources'],
          autoScale: true,
          useShadowDom: true,
          defaults: {
            displaySize: 40,
            transparency: 0.9,
            theme: 'Monokai Pro'
          }
        })

        // Add custom styles for better mobile experience
        const style = document.createElement('style')
        style.textContent = `
          .eruda-dev-tools {
            z-index: 9999999 !important;
          }
          .eruda-entry-btn {
            opacity: 0.8 !important;
          }
          .eruda-entry-btn:hover {
            opacity: 1 !important;
          }
        `
        document.head.appendChild(style)

        // Store enabled state
        localStorage.setItem('eruda-enabled', 'true')
        
        console.log('🔧 Eruda debugging tools initialized')
        console.log('💡 Tip: Add ?debug=false to the URL to disable Eruda')
      }).catch((error) => {
        console.warn('Failed to load Eruda:', error)
      })
    } else {
      // Remove from localStorage if explicitly disabled
      if (debugParam === 'false' || debugParam === '0') {
        localStorage.removeItem('eruda-enabled')
      }
    }

    // Add keyboard shortcut to toggle Eruda (Ctrl/Cmd + Shift + D)
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        
        const isCurrentlyEnabled = localStorage.getItem('eruda-enabled') === 'true'
        
        if (isCurrentlyEnabled) {
          localStorage.removeItem('eruda-enabled')
          window.location.reload()
        } else {
          localStorage.setItem('eruda-enabled', 'true')
          window.location.reload()
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [forceEnable, enableInDev, enableInProd, urlParam])

  return null
}

// Utility function to manually enable/disable Eruda
export const toggleEruda = () => {
  if (typeof window === 'undefined') return
  
  const isEnabled = localStorage.getItem('eruda-enabled') === 'true'
  
  if (isEnabled) {
    localStorage.removeItem('eruda-enabled')
  } else {
    localStorage.setItem('eruda-enabled', 'true')
  }
  
  window.location.reload()
}

// Utility function to check if Eruda is enabled
export const isErudaEnabled = () => {
  if (typeof window === 'undefined') return false
  
  const isDev = process.env.NODE_ENV === 'development'
  const urlParams = new URLSearchParams(window.location.search)
  const debugParam = urlParams.get('debug')
  const isDebugMode = debugParam === 'true' || debugParam === '1'
  const persistentDebug = localStorage.getItem('eruda-enabled') === 'true'
  
  return isDev || isDebugMode || persistentDebug
}