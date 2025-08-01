'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  Image as ImageIcon,
  Copy,
  Download,
  Eye,
  Clock,
  Palette,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { ImageGenerationJob } from '@/lib/image-generation-api'
import { useImageGenerationSession } from '@/stores/image-generation-store'
import { useChatStore } from '@/stores/chat-store'

interface ImageGenerationResult {
  success: boolean
  message: string
  prompt: string
  style?: string
  size?: string
  quality?: string
  aspectRatio?: string
  timestamp: string
  type: string
}

interface ImageGenerationDisplayProps {
  content: string
  toolId?: string
}

function parseImageGeneration(content: string): { result: ImageGenerationResult | null; toolId: string | null } {
  try {
    // Extract the generate_image tool result and toolId
    const toolMatch = content.match(/{% tool_complete 'generate_image' '([^']+)' %}[\s\S]*?{% tool_description %}[^%]*{% end_tool_description %}\s*([\s\S]*?){% endtool %}/);
    if (toolMatch && toolMatch[1] && toolMatch[2]) {
      const toolId = toolMatch[1]
      const jsonString = toolMatch[2].trim()
      const result = JSON.parse(jsonString)
      return { result, toolId }
    }
  } catch (e) {
    console.warn('Failed to parse image generation:', e)
  }
  return { result: null, toolId: null }
}

function ImageGenerationCard({ result, toolId }: { result: ImageGenerationResult; toolId: string }) {
  const [expanded, setExpanded] = useState(false)
  const { currentSession } = useChatStore()
  const sessionId = currentSession?.id || null
  const imageGenSession = useImageGenerationSession(sessionId)
  
  const [imageJob, setImageJob] = useState<ImageGenerationJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleCopyData = async () => {
    try {
      const data = JSON.stringify({ result, imageJob }, null, 2)
      await navigator.clipboard.writeText(data)
    } catch (err) {
      console.error('Failed to copy image generation data:', err)
    }
  }

  const handleDownloadImage = async () => {
    if (!imageJob?.result) return
    
    try {
      // Convert base64 to blob
      const base64Data = imageJob.result.replace(/^data:image\/[a-z]+;base64,/, '')
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `generated-image-${toolId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download image:', err)
    }
  }

  // Fetch the generated image using the new store
  useEffect(() => {
    if (!toolId || !sessionId) {
      setLoading(false)
      return
    }

    console.log('[ImageGenerationDisplay] Looking for job with ID:', toolId, 'in session:', sessionId)

    // Check if we already have this job in the store
    const existingJob = imageGenSession.getJob(toolId)
    if (existingJob) {
      console.log('[ImageGenerationDisplay] Found existing job:', existingJob)
      setImageJob(existingJob)
      
      if (existingJob.status === 'completed') {
        setLoading(false)
        return
      } else if (existingJob.status === 'failed') {
        setError(existingJob.error || 'Image generation failed')
        setLoading(false)
        return
      }
    }

    // If this is a new generation request, start it
    if (result.success && result.prompt && !existingJob) {
      console.log('[ImageGenerationDisplay] Starting new generation for prompt:', result.prompt)
      
      const request = {
        prompt: result.prompt,
        size: result.size,
        quality: result.quality,
      }
      
      setLoading(true)
      setError(null)
      
      imageGenSession.startGeneration(request)
        .then(job => {
          console.log('[ImageGenerationDisplay] Generation started:', job)
          setImageJob(job)
          // The store will automatically handle polling
        })
        .catch(err => {
          console.error('[ImageGenerationDisplay] Failed to start generation:', err)
          setError(err.message || 'Failed to start image generation')
          setLoading(false)
        })
    } else if (!existingJob) {
      // No existing job and not a new generation request
      setLoading(false)
      setError('Image generation data not found')
    }
  }, [toolId, sessionId, result, imageGenSession])

  // Subscribe to job updates
  useEffect(() => {
    if (!toolId || !sessionId) return

    const interval = setInterval(() => {
      const latestJob = imageGenSession.getJob(toolId)
      if (latestJob && latestJob !== imageJob) {
        console.log('[ImageGenerationDisplay] Job updated:', latestJob)
        setImageJob(latestJob)
        
        if (latestJob.status === 'completed') {
          setLoading(false)
          setError(null)
        } else if (latestJob.status === 'failed') {
          setError(latestJob.error || 'Image generation failed')
          setLoading(false)
        }
      }
    }, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [toolId, sessionId, imageJob, imageGenSession])

  const getStatusIcon = () => {
    if (loading && (!imageJob || imageJob.status === 'pending' || imageJob.status === 'processing')) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (imageJob?.status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (imageJob?.status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-yellow-500" />
  }

  const getStatusText = () => {
    if (loading && (!imageJob || imageJob.status === 'pending' || imageJob.status === 'processing')) {
      return 'Generating...'
    }
    if (error) return 'Error'
    if (imageJob?.status === 'completed') return 'Generated'
    if (imageJob?.status === 'failed') return 'Failed'
    if (imageJob?.status === 'processing') return 'Processing'
    return 'Pending'
  }

  const isPolling = toolId ? imageGenSession.isPolling(toolId) : false

  return (
    <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Image Generation
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    {getStatusIcon()}
                    {getStatusText()}
                  </Badge>
                  {isPolling && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Updating...
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {result.style || imageJob?.model || 'Default Style'} • {result.size || imageJob?.size || 'Auto Size'} • {result.quality || imageJob?.quality || 'Auto Quality'}
                </div>
              </div>
            </CardTitle>
            
            {/* Prompt Preview */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                <span className="font-medium text-gray-700">Prompt: </span>
                {result.prompt.length > 120 ? `${result.prompt.substring(0, 120)}...` : result.prompt}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyData}
              className="text-gray-500 hover:text-gray-700"
            >
              <Copy className="w-4 h-4" />
            </Button>
            {imageJob?.result && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadImage}
                className="text-gray-500 hover:text-gray-700"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Generated Image Display */}
      {(imageJob?.result || loading || error) && (
        <div className="px-6 pb-4">
          <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
            {loading && !imageJob?.result && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Generating image...</p>
                  {imageJob?.status && (
                    <p className="text-xs text-gray-400 mt-1">Status: {imageJob.status}</p>
                  )}
                </div>
              </div>
            )}
            
            {error && !imageJob?.result && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600">Failed to generate image</p>
                  <p className="text-xs text-gray-500 mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {imageJob?.result && (
              <img 
                src={imageJob.result}
                alt={imageJob.revisedPrompt || result.prompt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            )}
          </div>
        </div>
      )}

      {expanded && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-4">
            {/* Full Prompt */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Palette className="w-4 h-4 text-purple-500" />
                Full Prompt
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {imageJob?.revisedPrompt || result.prompt}
                </p>
              </div>
            </div>

            {/* Generation Settings */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Settings className="w-4 h-4 text-blue-500" />
                Generation Settings
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Style:</span>
                  <div className="font-medium capitalize">{result.style || imageJob?.model || 'Default'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Size:</span>
                  <div className="font-medium">{result.size || imageJob?.size || 'Auto'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Quality:</span>
                  <div className="font-medium capitalize">{result.quality || imageJob?.quality || 'Auto'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Aspect Ratio:</span>
                  <div className="font-medium">{result.aspectRatio || 'Square'}</div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            {imageJob && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Generation Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium capitalize flex items-center gap-1">
                      {getStatusIcon()}
                      {imageJob.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Model:</span>
                    <div className="font-medium">{imageJob.model || 'Default'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="font-medium">
                      {new Date(imageJob.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {imageJob.completedAt && (
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <div className="font-medium">
                        {new Date(imageJob.completedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Partial Images */}
                {imageJob.partialImages && imageJob.partialImages.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Eye className="w-4 h-4 text-orange-500" />
                      Partial Images ({imageJob.partialImages.length})
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      {imageJob.partialImages.map((partialImage, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={partialImage.startsWith('data:') ? partialImage : `data:image/png;base64,${partialImage}`}
                            alt={`Partial ${index + 1}`}
                            className="w-full h-full object-cover rounded border"
                          />
                          <Badge 
                            variant="secondary" 
                            className="absolute top-1 left-1 text-xs bg-white/90"
                          >
                            {index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tool ID */}
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">
                Tool ID: <code className="bg-gray-100 px-1 rounded">{toolId}</code>
                {sessionId && (
                  <>
                    {' • '}
                    Session: <code className="bg-gray-100 px-1 rounded">{sessionId.slice(0, 8)}</code>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function ImageGenerationDisplay({ content, toolId: propToolId }: ImageGenerationDisplayProps) {
  const { result, toolId: parsedToolId } = parseImageGeneration(content)
  const finalToolId = propToolId || parsedToolId
  
  if (!result || !finalToolId) {
    return null
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Image Generation</h3>
        <Badge variant="secondary" className="text-xs">
          {result.type}
        </Badge>
      </div>
      
      <ImageGenerationCard result={result} toolId={finalToolId} />
    </div>
  )
} 