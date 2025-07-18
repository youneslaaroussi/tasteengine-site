
'use client'

import { useMutation } from '@tanstack/react-query'
import { useAnalytics } from './use-analytics'

interface GenerateBookingUrlParams {
  searchId: string
  flightId: string
  termsUrl: string
}

async function generateBookingUrl(params: GenerateBookingUrlParams): Promise<{ bookingUrl: string }> {
  // This would be a call to your backend
  console.log('Generating booking URL for', params)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ bookingUrl: `https://gofly.to/book?search=${params.searchId}&flight=${params.flightId}` })
    }, 1200)
  })
}

export function useBooking() {
  const { trackEvent } = useAnalytics()

  const mutation = useMutation({
    mutationFn: (params: GenerateBookingUrlParams) => {
      trackEvent('book_flight', 'booking', params.flightId, 1)
      return generateBookingUrl(params)
    },
    onSuccess: (data) => {
      if (data && data.bookingUrl) {
        window.open(data.bookingUrl, '_blank')
      }
    },
  })

  return {
    generateBookingUrl: mutation.mutate,
    isGenerating: mutation.isPending,
  }
} 