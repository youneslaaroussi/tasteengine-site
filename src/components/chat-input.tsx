import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';
import { KeyboardEvent, useRef, useEffect, useCallback, memo, forwardRef, useImperativeHandle, useState } from 'react';
import { trackChatEvent, trackUserEngagement } from '@/lib/gtag';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export interface ChatInputRef {
  focus: () => void;
}

export const ChatInput = memo(forwardRef<ChatInputRef, ChatInputProps>(function ChatInput({ 
  input, 
  setInput, 
  handleSubmit, 
  isLoading, 
  onStop,
  placeholder = "Message Travel Assistant..."
}, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Expose focus method to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }), []);

  // Optimized auto-resize textarea with debouncing and requestAnimationFrame
  const resizeTextarea = useCallback(() => {
    if (!textareaRef.current) return;
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
      }
    });
  }, []);

  // Debounced resize effect
  useEffect(() => {
    // Clear existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    // Debounce the resize operation
    resizeTimeoutRef.current = setTimeout(() => {
      resizeTextarea();
    }, 10); // Small delay to group rapid changes
    
    // Cleanup function
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [input, resizeTextarea]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // On mobile, allow Enter to create new lines instead of submitting
      if (isMobile) {
        return; // Let the default behavior happen (new line)
      }
      
      // On desktop, prevent default and submit
      e.preventDefault();
      if (input.trim() && !isLoading) {
        // Track user message submission
        trackChatEvent('user_message_submit', {
          message_type: 'user_message',
          message_length: input.trim().length,
          input_method: 'keyboard',
        });
        handleSubmit();
      }
    }
  }, [input, isLoading, handleSubmit, isMobile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, [setInput]);

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3 bg-white border border-gray-300 rounded-lg shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-3 focus:ring-0 focus-visible:ring-0 text-gray-900 placeholder-gray-500"
            rows={1}
            disabled={isLoading}
          />
          
          <div className="flex-shrink-0 p-3">
            <Button
              type={isLoading ? "button" : "submit"}
              disabled={(!input.trim() && !isLoading)}
              onClick={isLoading ? () => {
                trackUserEngagement('stop_generation', 'chat_input');
                onStop?.();
              } : () => {
                if (input.trim()) {
                  trackChatEvent('user_message_submit', {
                    message_type: 'user_message',
                    message_length: input.trim().length,
                    input_method: 'button',
                  });
                  handleSubmit();
                }
              }}
              size="sm"
              className={`w-8 h-8 p-0 rounded-md transition-colors ${
                isLoading 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : input.trim() 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Square className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            {isMobile 
              ? "Press Send button to submit, Enter for new line" 
              : "Press Enter to send, Shift+Enter for new line"
            }
          </span>
          {isLoading && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              Generating response...
            </span>
          )}
        </div>
      </form>
    </div>
  );
})); 