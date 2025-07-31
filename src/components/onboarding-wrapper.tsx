'use client'

import { useState, useEffect } from 'react'
import { OnboardingModal } from './onboarding-modal'

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('gofly-to-onboarding-seen')
    
    // Show onboarding if they haven't seen it and after a small delay for loading
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(true)
        setIsLoaded(true)
      }, 1000) // Small delay to ensure loading is complete
      
      return () => clearTimeout(timer)
    } else {
      setIsLoaded(true)
    }
  }, [])

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem('gofly-to-onboarding-seen', 'true')
  }

  return (
    <>
      {children}
      {isLoaded && (
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={handleCloseOnboarding}
        />
      )}
    </>
  )
} 