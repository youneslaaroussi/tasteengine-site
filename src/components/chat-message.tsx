'use client'

import { memo } from 'react'
import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { extractToolResult, renderToolResult } from './tool-result-handler'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
}

const MessageContent = memo(({ content, isStreaming }: { content: string; isStreaming?: boolean }) => {
  // Extract tool results from content
  const toolResults = extractToolResult(content)
  
  // Remove tool markup from content for clean markdown rendering
  const cleanContent = content
    .replace(/{% \w+_start "[^"]*" %}\n?/g, '')
    .replace(/{% \w+_complete "[^"]*" %}\n\n[\s\S]*?(?=\n\n|\n?{% |$)/g, '')
    .trim()

  return (
    <div className="space-y-3">
      {/* Render regular markdown content */}
      {cleanContent && (
        <div className="prose prose-sm max-w-none prose-gray">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-3 last:mb-0 pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="mb-3 last:mb-0 pl-4">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              code: ({ children, ...props }) => {
                const inline = !props.className?.includes('language-')
                return inline ? (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
                ) : (
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                    <code>{children}</code>
                  </pre>
                )
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-2 py-1">{children}</td>
              ),
            }}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>
      )}
      
      {/* Render tool results */}
      {toolResults.map((result, index) => (
        <div key={index}>
          {renderToolResult(result)}
        </div>
      ))}
      
      {/* Streaming indicator */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
      )}
    </div>
  )
})

MessageContent.displayName = 'MessageContent'

export const ChatMessage = memo(({ message, isStreaming }: ChatMessageProps) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="chat-message border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("chat-message", isUser ? "user bg-gray-50" : "assistant bg-white")}>
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isUser 
                ? "bg-gray-600 text-white" 
                : "bg-blue-600 text-white"
            )}>
              {isUser ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {isUser ? 'You' : 'GoFlyTo'}
                </span>
              </div>
              
              <div className="text-gray-800">
                {message.content ? (
                  <MessageContent content={message.content} isStreaming={isStreaming} />
                ) : isStreaming ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

ChatMessage.displayName = 'ChatMessage'