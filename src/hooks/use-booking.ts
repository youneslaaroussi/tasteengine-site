
'use client'

import { useMutation } from '@tanstack/react-query'
import { useAnalytics } from './use-analytics'

interface GenerateBookingUrlParams {
  searchId: string
  flightId: string
  termsUrl: string
}

async function generateBookingUrl(params: { searchId: string, termsUrl: string }): Promise<{ bookingUrl: string }> {
  const response = await fetch('https://api.gofly.to/booking/generate-booking-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchId: params.searchId,
      termsUrl: params.termsUrl,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Booking API error:', errorBody)
    throw new Error(`Booking failed: ${response.statusText}`)
  }

  return response.json()
}

export function useBooking() {
  const { trackEvent } = useAnalytics()

  const mutation = useMutation({
    mutationFn: (params: GenerateBookingUrlParams) => {
      trackEvent('book_flight', 'booking', params.flightId, 1)
      return generateBookingUrl({
        searchId: params.searchId,
        termsUrl: params.termsUrl,
      })
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