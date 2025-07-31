'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon,
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Sparkles,
  Eye,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { imageGenerationApi, ImageGenerationJob } from '@/lib/image-generation-api';

interface ImageGenerationRendererProps {
  data: any;
  toolName: string;
}

interface ImageResult {
  jobId?: string;
  prompt?: string;
  status?: string;
  model?: string;
  size?: string;
  quality?: string;
  result?: string; // base64 image data
  partialImages?: string[];
  revisedPrompt?: string;
  error?: string;
  imageUrl?: string; // direct image URL
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <ImageIcon className="w-4 h-4 text-gray-600" />;
  }
};

const getStatusBadge = (status: string) => {
  const badges: Record<string, React.ReactElement> = {
    'pending': <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>,
    'processing': <Badge variant="secondary" className="bg-blue-100 text-blue-800">🔄 Processing</Badge>,
    'completed': <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Completed</Badge>,
    'failed': <Badge variant="destructive">❌ Failed</Badge>
  };
  return badges[status] || <Badge variant="outline">{status}</Badge>;
};

const ImageDisplay = ({ src, alt, onDownload }: { src: string; alt: string; onDownload?: () => void }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      <div className="relative group rounded-lg overflow-hidden border bg-gray-50">
        <img
          src={src}
          alt={alt}
          className={`w-full h-auto transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          style={{ maxHeight: '400px', objectFit: 'contain' }}
        />
        
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {imageLoaded && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsFullscreen(true)}
              className="backdrop-blur-sm"
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              View
            </Button>
            {onDownload && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onDownload}
                className="backdrop-blur-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              ✕
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export function ImageGenerationRenderer({ data: rawData, toolName }: ImageGenerationRendererProps) {
  const [currentJob, setCurrentJob] = useState<ImageResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  // Initialize with the data provided
  useEffect(() => {
    console.log('[ImageGenerationRenderer] Data received:', rawData);

    const data = JSON.parse(rawData.slice(58));
    console.log('[ImageGenerationRenderer] Parsed data:', data);
    
    // Check cache first for any existing job data
    if (data?.jobId) {
      setJobId(data.jobId);
      const cachedJob = imageGenerationApi.getCachedJobById(data.jobId);
      if (cachedJob) {
        console.log('[ImageGenerationRenderer] Found cached job:', cachedJob);
        setCurrentJob(cachedJob);
        
        // If cached job is completed, no need to poll
        if (cachedJob.status === 'completed' || cachedJob.status === 'failed') {
          console.log('[ImageGenerationRenderer] Using completed cached job');
          return;
        }
      }
    }

    if (data) {
      // Debug the condition evaluation
      console.log('[ImageGenerationRenderer] Condition check:', {
        hasSuccess: !!data.success,
        success: data.success,
        hasPrompt: !!data.prompt,
        prompt: data.prompt,
        hasJobId: !!data.jobId,
        jobId: data.jobId,
        shouldStartGeneration: data.success && data.prompt && !data.jobId,
        dataKeys: Object.keys(data),
        dataType: typeof data,
        dataConstructor: data.constructor?.name
      });

      // Try to find the actual data object
      let actualData = data;
      if (data && typeof data === 'object' && !data.success && !data.prompt) {
        // Check if data has any properties that contain the actual data
        const possibleDataProps = Object.keys(data).filter(key => 
          data[key] && typeof data[key] === 'object' && 
          (data[key].success || data[key].prompt)
        );
        console.log('[ImageGenerationRenderer] Possible data properties:', possibleDataProps);
        
        if (possibleDataProps.length > 0) {
          actualData = data[possibleDataProps[0]];
          console.log('[ImageGenerationRenderer] Using nested data:', actualData);
        }
      }

      // Check if this is a preparation response (has success/message but no jobId)
      if (actualData.success && actualData.prompt && !actualData.jobId) {
        console.log('[ImageGenerationRenderer] Detected preparation response, starting image generation...');
        startImageGeneration(actualData);
      } else if (actualData.jobId) {
        // This is an actual job response
        setJobId(actualData.jobId);
        setCurrentJob(actualData);
        
        // If we have a jobId and the status is pending/processing, start polling
        if (actualData.status === 'pending' || actualData.status === 'processing') {
          console.log('[ImageGenerationRenderer] Starting polling because jobId exists and status is:', actualData.status);
          startPolling(actualData.jobId);
        }
      } else {
        // Set whatever data we have
        setCurrentJob(actualData);
        console.log('[ImageGenerationRenderer] Set current job data:', actualData);
      }
    }
  }, [rawData]);

  // Persist current job state to sessionStorage
  useEffect(() => {
    if (currentJob && jobId) {
      const key = `image_job_${jobId}`;
      try {
        sessionStorage.setItem(key, JSON.stringify({
          job: currentJob,
          timestamp: Date.now()
        }));
        console.log('[ImageGenerationRenderer] Persisted job to session storage:', jobId);
      } catch (error) {
        console.warn('[ImageGenerationRenderer] Failed to persist job to session storage:', error);
      }
    }
  }, [currentJob, jobId]);

  // Restore job state from sessionStorage on mount
  useEffect(() => {
    if (jobId && !currentJob) {
      const key = `image_job_${jobId}`;
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const { job, timestamp } = JSON.parse(stored);
          const age = Date.now() - timestamp;
          // Only restore if less than 1 hour old
          if (age < 60 * 60 * 1000) {
            console.log('[ImageGenerationRenderer] Restored job from session storage:', jobId);
            setCurrentJob(job);
            
            // If job is not completed and not too old, resume polling
            if (job.status !== 'completed' && job.status !== 'failed' && age < 10 * 60 * 1000) {
              console.log('[ImageGenerationRenderer] Resuming polling for restored job');
              startPolling(jobId);
            }
          } else {
            // Remove old data
            sessionStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('[ImageGenerationRenderer] Failed to restore job from session storage:', error);
      }
    }
  }, [jobId]);

  // Cleanup old session storage entries on mount
  useEffect(() => {
    const cleanupOldSessions = () => {
      try {
        const keys = Object.keys(sessionStorage);
        const imageJobKeys = keys.filter(key => key.startsWith('image_job_'));
        const now = Date.now();
        
        imageJobKeys.forEach(key => {
          try {
            const stored = sessionStorage.getItem(key);
            if (stored) {
              const { timestamp } = JSON.parse(stored);
              const age = now - timestamp;
              // Remove entries older than 6 hours
              if (age > 6 * 60 * 60 * 1000) {
                sessionStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Remove invalid entries
            sessionStorage.removeItem(key);
          }
        });
        
        console.log('[ImageGenerationRenderer] Cleaned up old session storage entries');
      } catch (error) {
        console.warn('[ImageGenerationRenderer] Failed to cleanup session storage:', error);
      }
    };
    
    cleanupOldSessions();
  }, []);

  const startImageGeneration = async (imageData = rawData) => {
    if (!imageData?.prompt) {
      console.error('[ImageGenerationRenderer] No prompt available for image generation');
      return;
    }

    console.log('[ImageGenerationRenderer] Starting image generation with prompt:', imageData.prompt);
    
    try {
      // Convert the preparation data to ImageGenerationRequest format
      const request = {
        prompt: imageData.prompt,
      };

      // Start the image generation job
      const job = await imageGenerationApi.generateImage(request);
      console.log('[ImageGenerationRenderer] Image generation job started:', job);
      
      setJobId(job.jobId);
      setCurrentJob(job);
      
      // Start polling for updates
      if (job.jobId) {
        startPolling(job.jobId);
      }
    } catch (error) {
      console.error('[ImageGenerationRenderer] Failed to start image generation:', error);
      const failedJob = {
        prompt: imageData.prompt,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start image generation'
      };
      setCurrentJob(failedJob);
    }
  };

  const startPolling = async (jobId: string) => {
    if (isPolling) return;
    
    console.log('[ImageGenerationRenderer] Starting polling for jobId:', jobId);
    setIsPolling(true);
    try {
      const finalJob = await imageGenerationApi.pollJobUntilComplete(
        jobId,
        (job: ImageGenerationJob) => {
          console.log('[ImageGenerationRenderer] Polling update:', job.status, job);
          setCurrentJob(job);
        },
        30 // Max 30 attempts (about 5 minutes with exponential backoff)
      );
      console.log('[ImageGenerationRenderer] Polling completed:', finalJob);
      setCurrentJob(finalJob);
    } catch (error) {
      console.error('[ImageGenerationRenderer] Polling failed:', error);
      setCurrentJob(prev => prev ? { 
        ...prev, 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Polling timeout' 
      } : null);
    } finally {
      setIsPolling(false);
    }
  };

  const downloadImage = (imageData: string, filename: string) => {
    try {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!currentJob) {
    return (
      <Card className="p-3 bg-gray-50 border-gray-200">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          No image generation data
        </div>
      </Card>
    );
  }

  const hasError = currentJob.status === 'failed' || currentJob.error;
  const isComplete = currentJob.status === 'completed';
  const hasResult = currentJob.result || currentJob.imageUrl;

  return (
    <Card className={`p-4 ${hasError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="space-y-4">
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(currentJob.status || 'pending')}
            <span className="font-medium text-sm">Image Generation</span>
          </div>
          {getStatusBadge(currentJob.status || 'pending')}
        </div>

        {/* Prompt display */}
        {currentJob.prompt && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Prompt</span>
            </div>
            <div className="text-sm text-gray-700 italic bg-white/50 p-2 rounded border">
              "{currentJob.prompt}"
            </div>
          </div>
        )}

        {/* Revised prompt if different */}
        {currentJob.revisedPrompt && currentJob.revisedPrompt !== currentJob.prompt && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Revised Prompt</span>
            </div>
            <div className="text-sm text-gray-700 italic bg-white/50 p-2 rounded border">
              "{currentJob.revisedPrompt}"
            </div>
          </div>
        )}

        {/* Generation parameters */}
        {(currentJob.model || currentJob.size || currentJob.quality) && (
          <div className="flex flex-wrap gap-2">
            {currentJob.model && (
              <Badge variant="outline" className="text-xs">
                {currentJob.model}
              </Badge>
            )}
            {currentJob.size && (
              <Badge variant="outline" className="text-xs">
                {currentJob.size}
              </Badge>
            )}
            {currentJob.quality && (
              <Badge variant="outline" className="text-xs">
                {currentJob.quality} quality
              </Badge>
            )}
          </div>
        )}

        {/* Partial images */}
        {currentJob.partialImages && currentJob.partialImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">
                Partial Preview{currentJob.partialImages.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {currentJob.partialImages.map((partialImage, index) => (
                <div key={index} className="relative">
                  <ImageDisplay
                    src={partialImage.startsWith('data:') ? partialImage : `data:image/png;base64,${partialImage}`}
                    alt={`Partial image ${index + 1}`}
                    onDownload={() => downloadImage(partialImage, `partial-${index + 1}.png`)}
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

        {/* Final result image */}
        {hasResult && isComplete && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">Generated Image</span>
            </div>
            <ImageDisplay
              src={currentJob.imageUrl || (currentJob.result?.startsWith('data:') ? currentJob.result : `data:image/png;base64,${currentJob.result}`)}
              alt="Generated image"
              onDownload={() => {
                const imageData = currentJob.imageUrl || currentJob.result;
                if (imageData) {
                  downloadImage(imageData, 'generated-image.png');
                }
              }}
            />
          </div>
        )}

        {/* Error display */}
        {hasError && (
          <div className="flex items-start gap-2 p-2 bg-red-100 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <div className="font-medium">Generation Failed</div>
              <div className="text-red-600">{currentJob.error || 'Unknown error occurred'}</div>
            </div>
          </div>
        )}

        {/* Job info */}
        {currentJob.jobId && (
          <div className="text-xs text-gray-500 font-mono">
            Job ID: {currentJob.jobId}
          </div>
        )}

        {/* Polling indicator */}
        {isPolling && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Checking for updates...
          </div>
        )}
      </div>
    </Card>
  );
} 