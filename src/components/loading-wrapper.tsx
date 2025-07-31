'use client'

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface LoadingWrapperProps {
  children: React.ReactNode
}

export function LoadingWrapper({ children }: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Set timer to hide loading screen after 4 seconds
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.8,
            ease: "easeOut"
          }}
          className="flex flex-col items-center"
        >
          <Image
            src="/logo.png"
            alt="App Logo"
            width={456}
            height={456}
            className="w-60 h-60 object-contain"
            priority
          />
        </motion.div>
      </motion.div>
    )
  }

  return <>{children}</>
} 