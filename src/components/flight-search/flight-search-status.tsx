'use client'

import React from 'react'
import { useFlightSearch } from '@/contexts/flight-search-provider'
import {
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

export function FlightSearchStatus() {
  const { searchId, isSearching, error, flights } = useFlightSearch()

  if (!searchId) {
    return null
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="w-5 h-5" />
        <p>Error: {error}</p>
      </div>
    )
  }

  if (isSearching) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Search className="w-5 h-5 animate-pulse" />
        <p>Searching... Found {flights.length} flights.</p>
      </div>
    )
  }

  if (flights.length > 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <p>Search complete. Found {flights.length} flights.</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Clock className="w-5 h-5" />
      <p>No results found for your search.</p>
    </div>
  )
}