'use client'

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Send, Square, Paperclip, X, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChatContext } from '@/contexts/chat-context'
import { useFlightSearch } from '@/contexts/flight-search-provider'

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
    const chat = useChatContext()
    const { flights, searchId, isSearching } = useFlightSearch()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }, [])

    // Remove image from preview
    const removeImage = useCallback((index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!chat.isLoading && (input.trim() || images.length > 0)) {
          const flightData = {
            searchId: searchId,
            flights: flights,
          }
          chat.handleSubmit(e, input.trim(), flightData, images)
          setInput('')
          setImages([])
          chat.trackEvent('send_message', 'chat', 'chat_message', 1)
        }
      }
    }, [chat, input, images, searchId, flights])

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault()
      if (!chat.isLoading && (input.trim() || images.length > 0)) {
        const flightData = {
          searchId: searchId,
          flights: flights,
        }
        chat.handleSubmit(e, input.trim(), flightData, images)
        setInput('')
        setImages([])
        chat.trackEvent('send_message', 'chat', 'chat_message', 1)
      }
    }, [chat, input, images, searchId, flights])

    // Expose focus method
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus()
    }), [])

    return (
      <div className={cn("chat-input-container", className)}>
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

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-300 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="flex-1 border-none shadow-none outline-none resize-none bg-transparent p-0 text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ minHeight: '24px', maxHeight: '120px' }}
                disabled={chat.isLoading}
              />
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Image upload button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  disabled={chat.isLoading}
                >
                  <Image className="h-4 w-4" />
                </Button>

                {/* Send/Stop button */}
                {chat.isLoading || isSearching ? (
                  <Button
                    type="button"
                    onClick={chat.stop}
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