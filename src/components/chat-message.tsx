import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StatusMessage, ThinkingMessage, ToolProgress } from './tool-status';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    createdAt?: Date;
  };
  isStreaming?: boolean;
}

// Tool state management for tracking active tools
interface ToolState {
  name: string;
  description?: string;
  progressSteps: Array<{ text: string; progress: number }>;
  isComplete: boolean;
  completeText?: string;
}

// Pure function for parsing tool content - memoized at the component level
function parseToolContent(content: string) {
  const elements: Array<{ type: 'text' | 'status' | 'thinking' | 'tool'; content: any }> = [];
  const toolStates = new Map<string, ToolState>();
  
  // Split content by custom syntax patterns
  const parts = content.split(/(\{% [^%]+? %\})/g);
  
  for (const part of parts) {
    if (part.match(/^\{% .+? %\}$/)) {
      // Handle custom tool syntax
      const match = part.match(/^\{% ([^"]+?) "([^"]*)"(?: (\d+))? %\}$/);
      if (match) {
        const [, fullCommand, text, progress] = match;
        const commandParts = fullCommand.trim().split('_');
        
        if (fullCommand === 'status') {
          elements.push({ type: 'status', content: text });
        } 
        else if (fullCommand === 'thinking') {
          elements.push({ type: 'thinking', content: text });
        }
        else if (commandParts.length >= 2) {
          // Handle tool actions: search_flights_start -> toolName: search_flights, action: start
          const action = commandParts[commandParts.length - 1];
          const toolName = commandParts.slice(0, -1).join('_');
          
          if (action === 'start') {
            toolStates.set(toolName, {
              name: toolName,
              description: text,
              progressSteps: [],
              isComplete: false
            });
          }
          else if (action === 'progress') {
            const tool = toolStates.get(toolName);
            if (tool) {
              tool.progressSteps.push({
                text: text,
                progress: parseInt(progress || '0')
              });
            }
          }
          else if (action === 'complete') {
            const tool = toolStates.get(toolName);
            if (tool) {
              tool.isComplete = true;
              tool.completeText = text;
              elements.push({ type: 'tool', content: tool });
            }
          }
        }
      }
    } else if (part.trim()) {
      // Regular text content
      elements.push({ type: 'text', content: part });
    }
  }
  
  // Add any incomplete tools (still in progress)
  for (const tool of toolStates.values()) {
    if (!tool.isComplete && tool.progressSteps.length > 0) {
      elements.push({ type: 'tool', content: tool });
    }
  }
  
  return elements;
}

// Memoized markdown renderer for better performance
const MarkdownRenderer = memo(function MarkdownRenderer({ 
  content, 
  isStreaming 
}: { 
  content: string; 
  isStreaming?: boolean; 
}) {
  // Memoized markdown components
  const components = useMemo(() => ({
    // Custom styling for markdown elements
    p: ({ children }: any) => <p className="mb-3 last:mb-0">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-semibold mb-2 text-gray-900">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-semibold mb-2 text-gray-900">{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="text-gray-900">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-3">
        {children}
      </blockquote>
    ),
    a: ({ children, href }: any) => (
      <a 
        href={href} 
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  }), []);
  
  // For streaming content, we can optimize by not re-parsing markdown on every character
  // unless the content has reached a stable state or contains complete markdown structures
  const shouldOptimizeStreaming = isStreaming && content.length > 50;
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      // Skip some heavy processing during active streaming for very long content
      skipHtml={shouldOptimizeStreaming}
    >
      {content}
    </ReactMarkdown>
  );
});

export const ChatMessage = memo(function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Don't render data messages
  if (message.role === 'data') {
    return null;
  }
  
  // Parse content for tool statuses and regular text with better memoization
  const parsedContent = useMemo(() => {
    if (isUser) return [{ type: 'text' as const, content: message.content }];
    
    // For streaming messages, only re-parse when content has meaningful changes
    // This prevents expensive parsing on every character during streaming
    if (isStreaming && message.content.length < 100) {
      return [{ type: 'text' as const, content: message.content }];
    }
    
    return parseToolContent(message.content);
  }, [message.content, isUser, isStreaming]);
  
  return (
    <div className={cn(
      "group w-full text-gray-800 border-b border-gray-100",
      isUser ? "bg-gray-50" : "bg-white"
    )}>
      <div className="flex gap-4 p-6 max-w-full mx-auto">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isUser 
              ? "bg-blue-600 text-white" 
              : "bg-green-600 text-white"
          )}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {isUser ? 'You' : 'Travel Assistant'}
            </span>
            {message.createdAt && (
              <span className="text-xs text-gray-500">
                {message.createdAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="prose prose-sm max-w-none prose-gray">
            {isUser ? (
              // User messages stay as plain text
              <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
            ) : (
              // Assistant messages with tool status and markdown rendering
              <div className="text-gray-900 leading-relaxed">
                {parsedContent.map((element, index) => {
                  if (element.type === 'status') {
                    return <StatusMessage key={index} content={element.content} />;
                  }
                  
                  if (element.type === 'thinking') {
                    return <ThinkingMessage key={index} content={element.content} />;
                  }
                  
                  if (element.type === 'tool') {
                    const tool = element.content as ToolState;
                    return (
                      <ToolProgress
                        key={`${tool.name}-${index}`}
                        toolName={tool.name}
                        description={tool.description}
                        progress={tool.progressSteps[tool.progressSteps.length - 1]?.progress || 0}
                        progressText={tool.progressSteps[tool.progressSteps.length - 1]?.text}
                        isComplete={tool.isComplete}
                        completeText={tool.completeText}
                      />
                    );
                  }
                  
                  // Regular text content with optimized markdown rendering
                  if (element.content.trim()) {
                    return (
                      <MarkdownRenderer
                        key={index}
                        content={element.content}
                        isStreaming={isStreaming}
                      />
                    );
                  }
                  
                  return null;
                })}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-gray-900 ml-1 animate-pulse" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}); 