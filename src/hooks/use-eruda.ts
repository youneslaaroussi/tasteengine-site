'use client'

import { useEffect, useState } from 'react'
import { toggleEruda, isErudaEnabled } from '@/components/eruda'

/**
 * Custom hook for Eruda debugging utilities
 */
export function useEruda() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if Eruda is enabled
    setIsEnabled(isErudaEnabled())
    setIsLoading(false)
  }, [])

  const toggle = () => {
    toggleEruda()
  }

  const enable = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eruda-enabled', 'true')
      window.location.reload()
    }
  }

  const disable = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eruda-enabled')
      window.location.reload()
    }
  }

  return {
    isEnabled,
    isLoading,
    toggle,
    enable,
    disable
  }
}

/**
 * Hook to check if we're in debug mode
 */
export function useDebugMode() {
  const [isDebugMode, setIsDebugMode] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isDev = process.env.NODE_ENV === 'development'
    const urlParams = new URLSearchParams(window.location.search)
    const debugParam = urlParams.get('debug')
    const isUrlDebugMode = debugParam === 'true' || debugParam === '1'
    const persistentDebug = localStorage.getItem('eruda-enabled') === 'true'

    setIsDebugMode(isDev || isUrlDebugMode || persistentDebug)
  }, [])

  return isDebugMode
}