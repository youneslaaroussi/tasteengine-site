import { ChatMessage } from '@/types/campaign'
import { BookingFlightOption } from '@/types/flights'

/**
 * Flight campaign integration utilities
 * Handles the integration between flight search results and campaign messages
 */

export interface FlightMessageData {
  flights: BookingFlightOption[]
  searchId?: string
  totalFound: number
}

/**
 * Creates a campaign message for flight search results
 */
export function createFlightResultMessage(data: FlightMessageData): Omit<ChatMessage, 'id' | 'createdAt'> {
  const { flights, searchId, totalFound } = data

  return {
    role: 'data',
    content: `I found ${totalFound} flight${totalFound !== 1 ? 's' : ''} for you.`,
    flights: flights,
    searchId: searchId,
  }
}

/**
 * Creates a system message for flight loading completion
 */
export function createFlightLoadedSystemMessage(): Omit<ChatMessage, 'id' | 'createdAt'> {
  return {
    role: 'system',
    content: 'Flights loaded successfully.',
  }
}

/**
 * Safely adds flight results to campaign history
 */
export async function addFlightResultsToChat(
  data: FlightMessageData,
  addMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void
): Promise<void> {
  try {
    if (!data.flights || data.flights.length === 0) {
      console.warn('No flights to add to campaign history')
      return
    }

    const flightMessage = createFlightResultMessage(data)
    addMessage(flightMessage)

    // Auto-send system message indicating flights loaded successfully
    setTimeout(() => {
      const systemMessage = createFlightLoadedSystemMessage()
      addMessage(systemMessage)
    }, 500) // Small delay to ensure proper message ordering

  } catch (error) {
    console.error('Error adding flight results to campaign:', error)

    // Add a fallback message if the detailed message fails
    try {
      addMessage({
        role: 'assistant',
        content: 'I found some flights for you, but there was an issue displaying them. Please try searching again.',
      })
    } catch (fallbackError) {
      console.error('Failed to add fallback message:', fallbackError)
    }
  }
}

/**
 * Determines if flight results should be added to campaign
 */
export function shouldAddFlightResults(
  wasSearching: boolean,
  isSearching: boolean,
  flights: BookingFlightOption[]
): boolean {
  return (
    wasSearching &&
    !isSearching &&
    flights &&
    flights.length > 0
  )
}