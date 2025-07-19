'use client'

import { useFlightSearch } from '@/contexts/flight-search-provider'
import { Button } from '@/components/ui/button'
import { X, RotateCw } from 'lucide-react'

export function FlightSearchControls() {
  const { isSearching, resetFlightSearch } = useFlightSearch()

  if (!isSearching) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => resetFlightSearch()}
      >
        <X className="mr-2 h-4 w-4" />
        Stop Search
      </Button>
    </div>
  )
}