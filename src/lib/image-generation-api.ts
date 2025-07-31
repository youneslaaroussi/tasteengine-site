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
  private cache: Map<string, ImageGenerationJob> = new Map()
  private readonly CACHE_KEY = 'image_generation_cache'
  private readonly CACHE_EXPIRY_HOURS = 24

  constructor() {
    // Use the backend URL configuration that's already set up
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003/ai'
    // Extract base URL (remove /ai suffix if present)
    this.baseUrl = backendUrl.replace('/ai', '') || 'http://localhost:3003'
    
    // Load cache from localStorage on initialization
    this.loadCacheFromStorage()
    
    // Clean up expired jobs periodically
    this.clearExpiredJobs()
  }

  private loadCacheFromStorage() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const now = Date.now()
        const expiryTime = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000
        
        // Only load if cache is not expired
        if (now - timestamp < expiryTime) {
          Object.entries(data).forEach(([jobId, job]) => {
            this.cache.set(jobId, job as ImageGenerationJob)
          })
          console.log(`[ImageGenerationApi] Loaded ${this.cache.size} jobs from cache`)
        } else {
          // Clear expired cache
          localStorage.removeItem(this.CACHE_KEY)
          console.log('[ImageGenerationApi] Cleared expired cache')
        }
      }
    } catch (error) {
      console.warn('[ImageGenerationApi] Failed to load cache from storage:', error)
    }
  }

  private saveCacheToStorage() {
    try {
      const data = Object.fromEntries(this.cache.entries())
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
      console.log(`[ImageGenerationApi] Saved ${this.cache.size} jobs to cache`)
    } catch (error) {
      console.warn('[ImageGenerationApi] Failed to save cache to storage:', error)
    }
  }

  private getCachedJob(jobId: string): ImageGenerationJob | null {
    return this.cache.get(jobId) || null
  }

  private setCachedJob(job: ImageGenerationJob) {
    this.cache.set(job.jobId, job)
    this.saveCacheToStorage()
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
        body: JSON.stringify(request),
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
      
      // Cache the initial job
      this.setCachedJob(job)
      
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

    // Check cache first - if we have a completed job, return it immediately
    const cachedJob = this.getCachedJob(jobId)
    if (cachedJob && cachedJob.status === 'completed' && cachedJob.result) {
      console.log('[ImageGenerationApi] Returning completed job from cache:', jobId);
      return cachedJob
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
          // If not found on server but we have it cached, return cached version
          if (cachedJob) {
            console.log('[ImageGenerationApi] Job not found on server, returning cached version');
            return cachedJob
          }
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
      
      // Cache the updated job data
      this.setCachedJob(job)
      
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

  /**
   * Get all cached jobs
   */
  getCachedJobs(): ImageGenerationJob[] {
    return Array.from(this.cache.values())
  }

  /**
   * Get a specific cached job by ID
   */
  getCachedJobById(jobId: string): ImageGenerationJob | null {
    return this.getCachedJob(jobId)
  }

  /**
   * Clear all cached jobs
   */
  clearCache(): void {
    this.cache.clear()
    try {
      localStorage.removeItem(this.CACHE_KEY)
      console.log('[ImageGenerationApi] Cache cleared')
    } catch (error) {
      console.warn('[ImageGenerationApi] Failed to clear cache from storage:', error)
    }
  }

  /**
   * Clear expired jobs from cache
   */
  clearExpiredJobs(): void {
    const now = Date.now()
    const expiredJobIds: string[] = []
    
    this.cache.forEach((job, jobId) => {
      // Remove jobs older than 24 hours that are completed or failed
      const jobAge = now - new Date(job.createdAt).getTime()
      const maxAge = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000
      
      if (jobAge > maxAge && (job.status === 'completed' || job.status === 'failed')) {
        expiredJobIds.push(jobId)
      }
    })
    
    expiredJobIds.forEach(jobId => {
      this.cache.delete(jobId)
    })
    
    if (expiredJobIds.length > 0) {
      this.saveCacheToStorage()
      console.log(`[ImageGenerationApi] Cleared ${expiredJobIds.length} expired jobs`)
    }
  }
}

// Create singleton instance
export const imageGenerationApi = new ImageGenerationApiService() 