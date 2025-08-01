import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { ImageGenerationJob, ImageGenerationRequest, imageGenerationApi } from '@/lib/image-generation-api'

export interface ImageGenerationStoreData {
  jobs: Record<string, ImageGenerationJob>
  activeJobs: string[]
  lastUpdated: string
}

interface ImageGenerationState {
  // Session-specific data
  sessionData: Record<string, ImageGenerationStoreData>
  
  // Current session jobs
  currentJobs: Record<string, ImageGenerationJob>
  activePolling: Record<string, boolean>
  
  // Loading states
  isGenerating: boolean
  isPolling: Record<string, boolean>
}

interface ImageGenerationActions {
  // Job management
  startImageGeneration: (sessionId: string, request: ImageGenerationRequest) => Promise<ImageGenerationJob>
  updateJob: (sessionId: string, jobId: string, job: ImageGenerationJob) => void
  getJob: (sessionId: string, jobId: string) => ImageGenerationJob | null
  getSessionJobs: (sessionId: string) => ImageGenerationJob[]
  
  // Polling management
  startPolling: (sessionId: string, jobId: string) => Promise<void>
  stopPolling: (jobId: string) => void
  isJobPolling: (jobId: string) => boolean
  
  // Session management
  getSessionData: (sessionId: string) => ImageGenerationStoreData
  clearSessionData: (sessionId: string) => void
  cleanupExpiredJobs: (sessionId: string) => void
  
  // Utilities
  exportSessionData: (sessionId: string) => string
  importSessionData: (sessionId: string, data: string) => void
}

type ImageGenerationStore = ImageGenerationState & ImageGenerationActions

const createEmptySessionData = (): ImageGenerationStoreData => ({
  jobs: {},
  activeJobs: [],
  lastUpdated: new Date().toISOString()
})

export const useImageGenerationStore = create<ImageGenerationStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      sessionData: {},
      currentJobs: {},
      activePolling: {},
      isGenerating: false,
      isPolling: {},
      
      // Job management
      startImageGeneration: async (sessionId: string, request: ImageGenerationRequest) => {
        set((state) => {
          state.isGenerating = true
        })
        
        try {
          console.log('[ImageGenerationStore] Starting image generation for session:', sessionId)
          const job = await imageGenerationApi.generateImage(request)
          
          set((state) => {
            // Ensure session data exists
            if (!state.sessionData[sessionId]) {
              state.sessionData[sessionId] = createEmptySessionData()
            }
            
            // Add job to session data
            state.sessionData[sessionId].jobs[job.jobId] = job
            state.sessionData[sessionId].activeJobs.push(job.jobId)
            state.sessionData[sessionId].lastUpdated = new Date().toISOString()
            
            // Add to current jobs for quick access
            state.currentJobs[job.jobId] = job
            state.isGenerating = false
          })
          
          // Start polling automatically
          get().startPolling(sessionId, job.jobId)
          
          return job
        } catch (error) {
          set((state) => {
            state.isGenerating = false
          })
          throw error
        }
      },
      
      updateJob: (sessionId: string, jobId: string, job: ImageGenerationJob) => {
        set((state) => {
          // Ensure session data exists
          if (!state.sessionData[sessionId]) {
            state.sessionData[sessionId] = createEmptySessionData()
          }
          
          // Update job in session data
          state.sessionData[sessionId].jobs[jobId] = job
          state.sessionData[sessionId].lastUpdated = new Date().toISOString()
          
          // Update current jobs
          state.currentJobs[jobId] = job
          
          // Remove from active jobs if completed or failed
          if (job.status === 'completed' || job.status === 'failed') {
            const activeIndex = state.sessionData[sessionId].activeJobs.indexOf(jobId)
            if (activeIndex > -1) {
              state.sessionData[sessionId].activeJobs.splice(activeIndex, 1)
            }
          }
        })
      },
      
      getJob: (sessionId: string, jobId: string) => {
        const sessionData = get().sessionData[sessionId]
        return sessionData?.jobs[jobId] || get().currentJobs[jobId] || null
      },
      
      getSessionJobs: (sessionId: string) => {
        const sessionData = get().sessionData[sessionId]
        if (!sessionData) return []
        
        return Object.values(sessionData.jobs).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      },
      
      // Polling management
      startPolling: async (sessionId: string, jobId: string) => {
        const { isJobPolling, updateJob } = get()
        
        if (isJobPolling(jobId)) {
          console.log('[ImageGenerationStore] Already polling job:', jobId)
          return
        }
        
        set((state) => {
          state.isPolling[jobId] = true
          state.activePolling[jobId] = true
        })
        
        try {
          console.log('[ImageGenerationStore] Starting polling for job:', jobId)
          
          const finalJob = await imageGenerationApi.pollJobUntilComplete(
            jobId,
            (progressJob: ImageGenerationJob) => {
              console.log('[ImageGenerationStore] Polling update:', progressJob.status, progressJob.jobId)
              updateJob(sessionId, jobId, progressJob)
            },
            30 // Max 30 attempts
          )
          
          console.log('[ImageGenerationStore] Polling completed:', finalJob)
          updateJob(sessionId, jobId, finalJob)
          
        } catch (error) {
          console.error('[ImageGenerationStore] Polling failed:', error)
          const currentJob = get().getJob(sessionId, jobId)
          if (currentJob) {
            updateJob(sessionId, jobId, {
              ...currentJob,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Polling timeout'
            })
          }
        } finally {
          set((state) => {
            state.isPolling[jobId] = false
            delete state.activePolling[jobId]
          })
        }
      },
      
      stopPolling: (jobId: string) => {
        set((state) => {
          state.isPolling[jobId] = false
          delete state.activePolling[jobId]
        })
      },
      
      isJobPolling: (jobId: string) => {
        return get().isPolling[jobId] || false
      },
      
      // Session management
      getSessionData: (sessionId: string) => {
        const sessionData = get().sessionData[sessionId]
        return sessionData || createEmptySessionData()
      },
      
      clearSessionData: (sessionId: string) => {
        set((state) => {
          delete state.sessionData[sessionId]
          
          // Clear current jobs for this session
          const sessionJobs = state.sessionData[sessionId]?.jobs || {}
          Object.keys(sessionJobs).forEach(jobId => {
            delete state.currentJobs[jobId]
            delete state.isPolling[jobId]
            delete state.activePolling[jobId]
          })
        })
      },
      
      cleanupExpiredJobs: (sessionId: string) => {
        const now = Date.now()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        set((state) => {
          const sessionData = state.sessionData[sessionId]
          if (!sessionData) return
          
          const expiredJobIds: string[] = []
          
          Object.entries(sessionData.jobs).forEach(([jobId, job]) => {
            const jobAge = now - new Date(job.createdAt).getTime()
            if (jobAge > maxAge && (job.status === 'completed' || job.status === 'failed')) {
              expiredJobIds.push(jobId)
            }
          })
          
          expiredJobIds.forEach(jobId => {
            delete sessionData.jobs[jobId]
            delete state.currentJobs[jobId]
            delete state.isPolling[jobId]
            delete state.activePolling[jobId]
            
            const activeIndex = sessionData.activeJobs.indexOf(jobId)
            if (activeIndex > -1) {
              sessionData.activeJobs.splice(activeIndex, 1)
            }
          })
          
          if (expiredJobIds.length > 0) {
            sessionData.lastUpdated = new Date().toISOString()
            console.log(`[ImageGenerationStore] Cleaned up ${expiredJobIds.length} expired jobs from session ${sessionId}`)
          }
        })
      },
      
      // Utilities
      exportSessionData: (sessionId: string) => {
        const sessionData = get().sessionData[sessionId]
        if (!sessionData) return JSON.stringify(createEmptySessionData(), null, 2)
        
        return JSON.stringify({
          version: '1.0.0',
          sessionId,
          data: sessionData,
          exportedAt: new Date().toISOString(),
        }, null, 2)
      },
      
      importSessionData: (sessionId: string, data: string) => {
        try {
          const parsed = JSON.parse(data)
          
          if (parsed.version !== '1.0.0') {
            throw new Error('Unsupported version')
          }
          
          set((state) => {
            state.sessionData[sessionId] = {
              ...parsed.data,
              lastUpdated: new Date().toISOString(),
            }
            
            // Load jobs into current jobs for quick access
            Object.values(parsed.data.jobs).forEach((job: any) => {
              state.currentJobs[job.jobId] = job
            })
          })
        } catch (error) {
          console.error('Failed to import image generation session data:', error)
          throw new Error('Invalid import data')
        }
      },
    })),
    {
      name: 'image-generation-store',
      // Only persist session data, not temporary state like polling status
      partialize: (state) => ({
        sessionData: state.sessionData,
      }),
    }
  )
)

// Helper hook to get session-specific data
export function useImageGenerationSession(sessionId: string | null) {
  const store = useImageGenerationStore()
  
  if (!sessionId) {
    return {
      jobs: [],
      startGeneration: async () => { throw new Error('No session ID') },
      getJob: () => null,
      isPolling: () => false,
      sessionData: createEmptySessionData(),
    }
  }
  
  return {
    jobs: store.getSessionJobs(sessionId),
    startGeneration: (request: ImageGenerationRequest) => store.startImageGeneration(sessionId, request),
    getJob: (jobId: string) => store.getJob(sessionId, jobId),
    updateJob: (jobId: string, job: ImageGenerationJob) => store.updateJob(sessionId, jobId, job),
    isPolling: store.isJobPolling,
    startPolling: (jobId: string) => store.startPolling(sessionId, jobId),
    sessionData: store.getSessionData(sessionId),
    cleanupExpired: () => store.cleanupExpiredJobs(sessionId),
  }
}