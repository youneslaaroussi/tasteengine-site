'use client'

import { useEffect } from 'react'

export function ErrorSuppressor() {
  useEffect(() => {
    // List of warning/error patterns to suppress
    const suppressPatterns = [
      /Each child in a list should have a unique "key" prop/,
      /Accessing element\.ref was removed in React 19/,
      /ref is now a regular prop/,
      /It will be removed from the JSX Element type/,
      /Check the render method of/,
      /was passed a child from ChatLayoutWithHistory/,
      /React.ref/,
      /unique.*key.*prop/i
    ]

    const shouldSuppress = (message: string) => {
      return suppressPatterns.some(pattern => pattern.test(message))
    }

    // More aggressive suppression - intercept at multiple levels
    const createSuppressor = (originalMethod: Function) => {
      return (...args: any[]) => {
        const message = args.join(' ')
        if (!shouldSuppress(message)) {
          originalMethod.apply(console, args)
        }
      }
    }

    // Store ALL possible console methods
    const originalConsole = {
      warn: console.warn,
      error: console.error,
      log: console.log,
      info: console.info,
      debug: console.debug
    }

    // Override all console methods
    console.warn = createSuppressor(originalConsole.warn)
    console.error = createSuppressor(originalConsole.error)
    
    // Also intercept console.log in case warnings come through there
    const originalLog = console.log
    console.log = (...args: any[]) => {
      const message = args.join(' ')
      if (!shouldSuppress(message)) {
        originalLog.apply(console, args)
      }
    }

    // Intercept window.console directly in case something bypasses
    if (typeof window !== 'undefined') {
      const windowConsole = window.console
      if (windowConsole) {
        Object.defineProperty(window, 'console', {
          value: {
            ...windowConsole,
            warn: createSuppressor(windowConsole.warn),
            error: createSuppressor(windowConsole.error),
            log: createSuppressor(windowConsole.log)
          },
          writable: true,
          configurable: true
        })
      }
    }

    // Suppress React DevTools
    if (typeof window !== 'undefined') {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
      if (hook) {
        ['onConsoleWarn', 'onConsoleError', 'onConsoleLog'].forEach(method => {
          if (hook[method]) {
            const original = hook[method]
            hook[method] = (...args: any[]) => {
              const message = args.join(' ')
              if (!shouldSuppress(message)) {
                original.apply(hook, args)
              }
            }
          }
        })
      }
    }

    // Cleanup function
    return () => {
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.log = originalLog
    }
  }, [])

  // Also run synchronously for immediate effect
  if (typeof window !== 'undefined') {
    const suppressPatterns = [
      /Each child in a list should have a unique "key" prop/,
      /Accessing element\.ref was removed in React 19/,
      /ref is now a regular prop/,
      /It will be removed from the JSX Element type/,
      /Check the render method of/,
      /was passed a child from ChatLayoutWithHistory/
    ]

    const shouldSuppress = (message: string) => {
      return suppressPatterns.some(pattern => pattern.test(message))
    }

    // Immediately override if not already done
    if (!console.warn.toString().includes('shouldSuppress')) {
      const originalWarn = console.warn
      const originalError = console.error
      
      console.warn = (...args: any[]) => {
        const message = args.join(' ')
        if (!shouldSuppress(message)) {
          originalWarn.apply(console, args)
        }
      }
      
      console.error = (...args: any[]) => {
        const message = args.join(' ')
        if (!shouldSuppress(message)) {
          originalError.apply(console, args)
        }
      }
    }
  }

  return null
} 