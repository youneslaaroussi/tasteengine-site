import { ProgressiveSearchResponse } from '@/types/flights'

export class FlightApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'FlightApiError'
  }
}

export class FlightApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
    // Only throw error when actually making a request, not during build
  }

  /**
   * Fetch flight search results for a given search ID
   */
  async fetchFlightResults(searchId: string): Promise<ProgressiveSearchResponse> {
    if (!searchId) {
      throw new FlightApiError('Search ID is required')
    }

    if (!this.baseUrl) {
      throw new FlightApiError('API endpoint not configured')
    }

    try {
      const url = `${this.baseUrl}/booking/search/${searchId}/results`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for better UX
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new FlightApiError(
            'Search not found or expired',
            404,
            'SEARCH_NOT_FOUND'
          )
        }
        
        if (response.status === 429) {
          throw new FlightApiError(
            'Too many requests. Please try again later.',
            429,
            'RATE_LIMITED'
          )
        }

        if (response.status >= 500) {
          throw new FlightApiError(
            'Server error. Please try again later.',
            response.status,
            'SERVER_ERROR'
          )
        }

        throw new FlightApiError(
          `Request failed with status ${response.status}`,
          response.status
        )
      }

      const data = await response.json()
      
      // Validate response structure
      if (!this.isValidProgressiveSearchResponse(data)) {
        throw new FlightApiError(
          'Invalid response format from server',
          500,
          'INVALID_RESPONSE'
        )
      }

      return data
    } catch (error) {
      if (error instanceof FlightApiError) {
        throw error
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new FlightApiError(
          'Network error. Please check your connection.',
          0,
          'NETWORK_ERROR'
        )
      }

      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new FlightApiError(
          'Request timed out. Please try again.',
          0,
          'TIMEOUT'
        )
      }

      throw new FlightApiError(
        'An unexpected error occurred',
        0,
        'UNKNOWN_ERROR'
      )
    }
  }

  /**
   * Cancel an ongoing search
   */
  async cancelSearch(searchId: string): Promise<void> {
    if (!searchId) {
      throw new FlightApiError('Search ID is required')
    }

    if (!this.baseUrl) {
      // Silently fail for cancel operations when API is not configured
      return
    }

    try {
      const url = `${this.baseUrl}/booking/search/${searchId}/cancel`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok && response.status !== 404) {
        throw new FlightApiError(
          `Failed to cancel search: ${response.status}`,
          response.status
        )
      }
    } catch (error) {
      if (error instanceof FlightApiError) {
        throw error
      }
      // Don't throw on cancel errors - they're not critical
      console.warn('Failed to cancel search:', error)
    }
  }

  /**
   * Validate if the response matches expected structure
   */
  private isValidProgressiveSearchResponse(data: any): data is ProgressiveSearchResponse {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.searchId === 'string' &&
      data.status &&
      typeof data.status === 'object' &&
      Array.isArray(data.newFlights) &&
      typeof data.pricingTokens === 'object' &&
      typeof data.hasMoreResults === 'boolean'
    )
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: FlightApiError, attempt: number): number {
    const baseDelay = 1000 // 1 second

    switch (error.code) {
      case 'RATE_LIMITED':
        return Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds
      case 'SERVER_ERROR':
        return Math.min(baseDelay * Math.pow(1.5, attempt), 15000) // Max 15 seconds
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return Math.min(baseDelay * Math.pow(2, attempt), 10000) // Max 10 seconds
      default:
        return Math.min(baseDelay * attempt, 5000) // Max 5 seconds
    }
  }

  /**
   * Determine if error is retryable
   */
  static isRetryableError(error: FlightApiError): boolean {
    return [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'RATE_LIMITED'
    ].includes(error.code || '')
  }
}

// Export singleton instance
export const flightApiService = new FlightApiService()