/// <reference lib="webworker" />
import * as Comlink from 'comlink'
import {
  BookingFlightOption,
  ProgressiveSearchResponse,
} from '@/types/flights'

const POLLING_INTERVAL = 6000 // 6 seconds

async function fetchFlightResults(
  searchId: string
): Promise<ProgressiveSearchResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/booking/search/${searchId}/results`
  )
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}

const flightSearchApi = {
  async startSearch(
    searchId: string,
    onUpdate: (data: ProgressiveSearchResponse) => void,
    onComplete: (data: ProgressiveSearchResponse) => void,
    onError: (error: string) => void
  ) {
    const accumulatedFlights = new Map<string, BookingFlightOption>()
    let isPolling = true

    const poll = async () => {
      if (!isPolling) return

      try {
        const data = await fetchFlightResults(searchId)

        data.newFlights.forEach(flight => {
          const pricingToken = data.pricingTokens[flight.id]
          accumulatedFlights.set(flight.id, { ...flight, pricingToken })
        })

        const updatedData = {
          ...data,
          newFlights: Array.from(accumulatedFlights.values()),
        }

        onUpdate(updatedData)

        const isSearchComplete =
          data.status.status === 'completed' || data.status.status === 'expired'
        const hasMoreServerResults = data.hasMoreResults

        if (isSearchComplete || !hasMoreServerResults) {
          isPolling = false
          onComplete(updatedData)
        } else {
          setTimeout(poll, data.nextPollAfter ? data.nextPollAfter * 1000 : POLLING_INTERVAL)
        }
      } catch (error) {
        isPolling = false
        onError(error instanceof Error ? error.message : 'An unknown error occurred')
      }
    }

    poll()
  },
}

Comlink.expose(flightSearchApi)

export type FlightSearchWorker = typeof flightSearchApi 