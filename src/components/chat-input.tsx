'use client'

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Send, Square, Paperclip, X, Image, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { HighlightedChatInput } from '@/components/highlighted-chat-input'
import { useChatContext } from '@/contexts/chat-context'
import { useFlightSearch } from '@/contexts/flight-search-provider'
import { DocumentAttachment } from '@/types/chat'

interface ChatInputProps {
  placeholder?: string
  className?: string
}

export interface ChatInputRef {
  focus: () => void
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  ({ placeholder = "Message TasteEngine...", className }, ref) => {
    const [input, setInput] = useState('')
    const [images, setImages] = useState<string[]>([])
    const [documents, setDocuments] = useState<DocumentAttachment[]>([])
    const [isParsingDocument, setIsParsingDocument] = useState(false)
    const campaign = useChatContext()
    const { flights, searchId, isSearching } = useFlightSearch()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const documentInputRef = useRef<HTMLInputElement>(null)

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const lineHeight = 24 // Approximate line height
      const newRows = Math.min(Math.max(Math.ceil(scrollHeight / lineHeight), 1), 5)
      
      textarea.style.height = `${Math.min(scrollHeight, lineHeight * 5)}px`
    }, [])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
      adjustTextareaHeight()
    }, [adjustTextareaHeight])

    // Handle image file selection
    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            setImages(prev => [...prev, base64])
          }
          reader.readAsDataURL(file)
        }
      })
      
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }, [])

    // Handle document file selection
    const handleDocumentSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      
      setIsParsingDocument(true)
      console.log('[PARSE] Starting to process', files.length, 'files')
      
      try {
        for (const file of files) {
          console.log('[PARSE] Processing file:', file.name, 'Size:', file.size, 'Type:', file.type)
          
          if (file.type === 'application/pdf' || 
              file.type === 'application/msword' ||
              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              file.name.toLowerCase().endsWith('.pdf') ||
              file.name.toLowerCase().endsWith('.doc') ||
              file.name.toLowerCase().endsWith('.docx')) {
            
            try {
              // Convert file to base64 instead of parsing
              const reader = new FileReader()
              
              await new Promise<void>((resolve, reject) => {
                reader.onload = (event) => {
                  const base64 = event.target?.result as string
                  const documentAttachment: DocumentAttachment = {
                    name: file.name,
                    type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 
                          file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'doc',
                    size: file.size,
                    data: base64
                  }
                  
                  setDocuments(prev => [...prev, documentAttachment])
                  console.log('[PARSE] Document encoded successfully:', file.name, 'Size:', file.size)
                  resolve()
                }
                
                reader.onerror = () => {
                  console.error('[PARSE] Failed to read file:', file.name)
                  reject(new Error('File read failed'))
                }
                
                reader.readAsDataURL(file)
              })
              
            } catch (parseError) {
              console.error('[PARSE] Failed to process individual file:', file.name, parseError)
              // Continue with other files instead of stopping
            }
          } else {
            console.warn('[PARSE] Unsupported file type:', file.name, file.type)
          }
        }
      } catch (error) {
        console.error('[PARSE] Document processing failed:', error)
        // TODO: Show user-friendly error message
      } finally {
        setIsParsingDocument(false)
        // Reset file input
        if (documentInputRef.current) {
          documentInputRef.current.value = ''
        }
      }
    }, [])

    // Remove image from preview
    const removeImage = useCallback((index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index))
    }, [])

    // Remove document from preview
    const removeDocument = useCallback((index: number) => {
      setDocuments(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!campaign.isLoading && !isParsingDocument && (input.trim() || images.length > 0 || documents.length > 0)) {
          const flightData = {
            searchId: searchId,
            flights: flights,
          }
          campaign.handleSubmit(e, input.trim(), flightData, images, documents)
          setInput('')
          setImages([])
          setDocuments([])
          campaign.trackEvent('send_message', 'campaign', 'chat_message', 1)
        }
      }
    }, [campaign, input, images, documents, isParsingDocument, searchId, flights])

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault()
      if (!campaign.isLoading && !isParsingDocument && (input.trim() || images.length > 0 || documents.length > 0)) {
        const flightData = {
          searchId: searchId,
          flights: flights,
        }
        campaign.handleSubmit(e, input.trim(), flightData, images, documents)
        setInput('')
        setImages([])
        setDocuments([])
        campaign.trackEvent('send_message', 'campaign', 'chat_message', 1)
      }
    }, [campaign, input, images, documents, isParsingDocument, searchId, flights])

    // Expose focus method
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus()
    }), [])

    return (
      <div className={cn("campaign-input-container", className)}>
        <div className="max-w-3xl mx-auto">
          {/* Image previews */}
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Document previews */}
          {documents.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {documents.map((doc, index) => (
                <div key={index} className="relative group bg-gray-100 border rounded-lg p-2 flex items-center gap-2 max-w-xs">
                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {doc.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {doc.type.toUpperCase()} • {(doc.size / 1024).toFixed(1)}KB • Ready to send
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-300 transition-colors">
              <HighlightedChatInput
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="flex-1 border-none shadow-none outline-none resize-none bg-transparent p-0 text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ minHeight: '24px', maxHeight: '120px' }}
                disabled={campaign.isLoading}
              />
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Image upload button */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  disabled={campaign.isLoading}
                >
                  <Image className="h-4 w-4" />
                </Button>

                {/* Document upload button */}
                <input
                  type="file"
                  ref={documentInputRef}
                  onChange={handleDocumentSelect}
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => documentInputRef.current?.click()}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  disabled={campaign.isLoading || isParsingDocument}
                >
                  {isParsingDocument ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </Button>

                {/* Send/Stop button */}
                {campaign.isLoading || isSearching ? (
                  <Button
                    type="button"
                    onClick={campaign.stop}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() && images.length === 0}
                    className="h-8 w-8 rounded-lg disabled:opacity-30"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
          
          <p className="text-xs text-muted-foreground text-center px-4 py-2 border-t">
            TasteEngine can make mistakes. Verify important strategic insights.
          </p>
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'