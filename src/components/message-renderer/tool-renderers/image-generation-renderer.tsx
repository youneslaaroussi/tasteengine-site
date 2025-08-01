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
import { ImageGenerationJob, ImageGenerationRequest } from '@/lib/image-generation-api';
import { useImageGenerationSession } from '@/stores/image-generation-store';
import { useChatStore } from '@/stores/chat-store';

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
  const { currentSession } = useChatStore();
  const sessionId = currentSession?.id || null;
  const imageGenSession = useImageGenerationSession(sessionId);
  
  const [currentJob, setCurrentJob] = useState<ImageGenerationJob | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Parse the incoming data
  const parsedData = React.useMemo(() => {
    try {
      console.log('[ImageGenerationRenderer] Raw data received:', rawData);
      const data = JSON.parse(rawData.slice(58));
      console.log('[ImageGenerationRenderer] Parsed data:', data);
      return data;
    } catch (error) {
      console.error('[ImageGenerationRenderer] Failed to parse data:', error);
      return null;
    }
  }, [rawData]);

  // Initialize or find existing job
  useEffect(() => {
    if (!parsedData || !sessionId) return;

    console.log('[ImageGenerationRenderer] Processing parsed data:', parsedData);

    // Try to find the actual data object if nested
    let actualData = parsedData;
    if (parsedData && typeof parsedData === 'object' && !parsedData.success && !parsedData.prompt) {
      const possibleDataProps = Object.keys(parsedData).filter(key => 
        parsedData[key] && typeof parsedData[key] === 'object' && 
        (parsedData[key].success || parsedData[key].prompt)
      );
      
      if (possibleDataProps.length > 0) {
        actualData = parsedData[possibleDataProps[0]];
        console.log('[ImageGenerationRenderer] Using nested data:', actualData);
      }
    }

    // If we have a jobId, try to find existing job
    if (actualData.jobId) {
      setJobId(actualData.jobId);
      const existingJob = imageGenSession.getJob(actualData.jobId);
      
      if (existingJob) {
        console.log('[ImageGenerationRenderer] Found existing job:', existingJob);
        setCurrentJob(existingJob);
        
        // Resume polling if job is not finished and not already being polled
        if ((existingJob.status === 'pending' || existingJob.status === 'processing') && 
            !imageGenSession.isPolling(actualData.jobId)) {
          console.log('[ImageGenerationRenderer] Resuming polling for job:', actualData.jobId);
          imageGenSession.startPolling(actualData.jobId);
        }
        return;
      } else {
        // Create job from the data we have
        const jobFromData: ImageGenerationJob = {
          id: actualData.jobId,
          jobId: actualData.jobId,
          status: actualData.status || 'pending',
          prompt: actualData.prompt,
          model: actualData.model,
          size: actualData.size,
          quality: actualData.quality,
          format: actualData.format,
          background: actualData.background,
          result: actualData.result,
          partialImages: actualData.partialImages,
          revisedPrompt: actualData.revisedPrompt,
          error: actualData.error,
          createdAt: actualData.createdAt || new Date().toISOString(),
          completedAt: actualData.completedAt,
          timestamp: actualData.timestamp || new Date().toISOString()
        };
        
        console.log('[ImageGenerationRenderer] Creating job from data:', jobFromData);
        imageGenSession.updateJob(actualData.jobId, jobFromData);
        setCurrentJob(jobFromData);
        
        // Start polling if not finished
        if (jobFromData.status === 'pending' || jobFromData.status === 'processing') {
          imageGenSession.startPolling(actualData.jobId);
        }
      }
    } else if (actualData.success && actualData.prompt) {
      // This is a preparation response - start new generation
      console.log('[ImageGenerationRenderer] Starting new image generation with prompt:', actualData.prompt);
      
      const request: ImageGenerationRequest = {
        prompt: actualData.prompt,
        model: actualData.model,
        size: actualData.size,
        quality: actualData.quality,
        format: actualData.format,
        background: actualData.background,
      };
      
      imageGenSession.startGeneration(request)
        .then(job => {
          console.log('[ImageGenerationRenderer] New generation started:', job);
          setJobId(job.jobId);
          setCurrentJob(job);
        })
        .catch(error => {
          console.error('[ImageGenerationRenderer] Failed to start generation:', error);
          setCurrentJob({
            id: 'error',
            jobId: 'error',
            status: 'failed',
            prompt: actualData.prompt,
            error: error instanceof Error ? error.message : 'Failed to start generation',
            createdAt: new Date().toISOString(),
            timestamp: new Date().toISOString()
          });
        });
    } else {
      // Set whatever data we have as a basic job
      setCurrentJob({
        id: 'unknown',
        jobId: 'unknown',
        status: actualData.status || 'pending',
        prompt: actualData.prompt || 'Unknown prompt',
        result: actualData.result,
        error: actualData.error,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
    }
  }, [parsedData, sessionId]);

  // Subscribe to job updates
  useEffect(() => {
    if (!jobId || !sessionId) return;

    // Poll for updates every 2 seconds if job is not finished
    const interval = setInterval(() => {
      const latestJob = imageGenSession.getJob(jobId);
      if (latestJob && latestJob !== currentJob) {
        console.log('[ImageGenerationRenderer] Job updated:', latestJob);
        setCurrentJob(latestJob);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, sessionId, currentJob, imageGenSession]);

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
          Loading image generation...
        </div>
      </Card>
    );
  }

  const hasError = currentJob.status === 'failed' || currentJob.error;
  const isComplete = currentJob.status === 'completed';
  const hasResult = currentJob.result || (currentJob as any).imageUrl;
  const isPolling = jobId ? imageGenSession.isPolling(jobId) : false;

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
              src={(currentJob as any).imageUrl || (currentJob.result?.startsWith('data:') ? currentJob.result : `data:image/png;base64,${currentJob.result}`)}
              alt="Generated image"
              onDownload={() => {
                const imageData = (currentJob as any).imageUrl || currentJob.result;
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
        {currentJob.jobId && currentJob.jobId !== 'unknown' && currentJob.jobId !== 'error' && (
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