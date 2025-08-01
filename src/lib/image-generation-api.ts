export interface ImageGenerationRequest {
  prompt: string
  model?: 'gpt-image-1' | 'dall-e-3' | 'dall-e-2'
  size?: 'auto' | '1024x1024' | '1536x1024' | '1024x1536'
  quality?: 'auto' | 'high' | 'medium' | 'low'
  format?: 'png' | 'jpeg' | 'webp'
  background?: 'auto' | 'opaque' | 'transparent'
  partialImages?: number
}

export interface ImageGenerationJob {
  id: string
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  prompt: string
  model?: string
  size?: string
  quality?: string
  format?: string
  background?: string
  result?: string // base64 image data
  partialImages?: string[] // base64 partial images
  revisedPrompt?: string
  error?: string
  createdAt: string
  completedAt?: string
  timestamp: string
}

export interface ImageStreamEvent {
  type: 'connected' | 'started' | 'partial_image' | 'completed' | 'finished' | 'error'
  content?: string
  message?: string
  partialIndex?: number
  imageData?: string
  revisedPrompt?: string
}

export class ImageGenerationApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ImageGenerationApiError'
  }
}

export class ImageGenerationApiService {
  private baseUrl: string

  constructor() {
    // Use the backend URL configuration that's already set up
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003/ai'
    // Extract base URL (remove /ai suffix if present)
    this.baseUrl = backendUrl.replace('/ai', '') || 'http://localhost:3003'
  }



  /**
   * Start a new image generation job
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationJob> {
    if (!request.prompt) {
      throw new ImageGenerationApiError('Prompt is required')
    }

    if (!this.baseUrl) {
      throw new ImageGenerationApiError('AI API endpoint not configured')
    }

          try {
      const url = `${this.baseUrl}/image/generate`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          }),
        signal: AbortSignal.timeout(10000), // 10 second timeout for job creation
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new ImageGenerationApiError(
            'Too many requests. Please try again later.',
            429,
            'RATE_LIMITED'
          )
        }

        if (response.status >= 500) {
          throw new ImageGenerationApiError(
            'Server error. Please try again later.',
            response.status,
            'SERVER_ERROR'
          )
        }

        throw new ImageGenerationApiError(
          `Request failed with status ${response.status}`,
          response.status
        )
      }

      const data = await response.json()
      
      const job: ImageGenerationJob = {
        id: data.jobId,
        jobId: data.jobId,
        status: 'pending',
        prompt: request.prompt,
        model: request.model,
        size: request.size,
        quality: request.quality,
        format: request.format,
        background: request.background,
        createdAt: data.timestamp,
        timestamp: data.timestamp
      }
      
      return job
    } catch (error) {
      if (error instanceof ImageGenerationApiError) {
        throw error
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new ImageGenerationApiError(
          'Network error. Please check your connection.',
          0,
          'NETWORK_ERROR'
        )
      }

      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ImageGenerationApiError(
          'Request timed out. Please try again.',
          0,
          'TIMEOUT'
        )
      }

      throw new ImageGenerationApiError(
        'An unexpected error occurred while starting image generation',
        0,
        'UNKNOWN_ERROR'
      )
    }
  }

  /**
   * Get the status of an image generation job
   */
  async getJobStatus(jobId: string): Promise<ImageGenerationJob> {
    if (!jobId) {
      throw new ImageGenerationApiError('Job ID is required')
    }



    if (!this.baseUrl) {
      throw new ImageGenerationApiError('AI API endpoint not configured')
    }

    try {
      const url = `${this.baseUrl}/image/generate/${jobId}`
      console.log('[ImageGenerationApi] Checking job status at:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      console.log('[ImageGenerationApi] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new ImageGenerationApiError(
            'Image generation job not found',
            404,
            'JOB_NOT_FOUND'
          )
        }

        throw new ImageGenerationApiError(
          `Request failed with status ${response.status}`,
          response.status
        )
      }

      const data = await response.json()
      console.log('[ImageGenerationApi] Job data received:', data);
      
      const job: ImageGenerationJob = {
        id: data.id,
        jobId: data.id,
        status: data.status,
        prompt: data.prompt,
        model: data.model,
        size: data.size,
        quality: data.quality,
        format: data.format,
        background: data.background,
        result: data.result,
        partialImages: data.partialImages,
        revisedPrompt: data.revisedPrompt,
        error: data.error,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
        timestamp: data.createdAt
      }
      
      return job
    } catch (error) {
      console.error('[ImageGenerationApi] Error getting job status:', error);
      if (error instanceof ImageGenerationApiError) {
        throw error
      }

      throw new ImageGenerationApiError(
        'An unexpected error occurred while checking job status',
        0,
        'UNKNOWN_ERROR'
      )
    }
  }

  /**
   * Start streaming image generation with progress updates
   */
  async generateImageStream(
    request: ImageGenerationRequest,
    onEvent: (event: ImageStreamEvent) => void
  ): Promise<void> {
    if (!request.prompt) {
      throw new ImageGenerationApiError('Prompt is required')
    }

    if (!this.baseUrl) {
      throw new ImageGenerationApiError('AI API endpoint not configured')
    }

    try {
      const url = `${this.baseUrl}/image/generate/stream`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new ImageGenerationApiError(
          `Stream request failed with status ${response.status}`,
          response.status
        )
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new ImageGenerationApiError('Unable to read stream response')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                return
              }

              try {
                const event: ImageStreamEvent = JSON.parse(data)
                onEvent(event)
              } catch (e) {
                // Skip invalid JSON lines
                console.warn('Failed to parse SSE data:', data)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (error instanceof ImageGenerationApiError) {
        throw error
      }

      throw new ImageGenerationApiError(
        'An unexpected error occurred during streaming',
        0,
        'STREAM_ERROR'
      )
    }
  }

  /**
   * Poll a job until completion with exponential backoff
   */
  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (job: ImageGenerationJob) => void,
    maxAttempts = 60
  ): Promise<ImageGenerationJob> {
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const job = await this.getJobStatus(jobId)
      
      if (onProgress) {
        onProgress(job)
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return job
      }

      // Exponential backoff: start with 1s, max 10s
      const delay = Math.min(1000 * Math.pow(1.5, attempts), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
      attempts++
    }

    throw new ImageGenerationApiError(
      'Job polling timeout - maximum attempts reached',
      0,
      'POLLING_TIMEOUT'
    )
  }


}

// Create singleton instance
export const imageGenerationApi = new ImageGenerationApiService() 