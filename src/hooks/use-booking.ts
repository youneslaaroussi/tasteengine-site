
'use client'

import { useMutation } from '@tanstack/react-query'

interface GenerateBookingUrlParams {
  searchId: string
  termsUrl: string
}

async function generateBookingUrl({ searchId, termsUrl }: GenerateBookingUrlParams): Promise<any> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/generate-booking-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchId, termsUrl }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate booking URL')
  }

  return response.json()
}

export function useBooking() {
  const mutation = useMutation({
    mutationFn: generateBookingUrl,
    onSuccess: (data) => {
      if (data && data.bookingUrl) {
        window.open(data.bookingUrl, '_blank', 'noopener,noreferrer')
      }
    },
    onError: (error) => {
      console.error('Booking URL generation failed:', error)
      // Here you could show a toast notification to the user
      alert('Sorry, we could not generate the booking link. Please try again.')
    },
  })

  return {
    generateBookingUrl: mutation.mutate,
    isGenerating: mutation.isPending,
  }
} 