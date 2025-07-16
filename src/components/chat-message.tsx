import { User, Bot, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StatusMessage, ToolProgress } from './tool-status';
import { extractToolResult, renderToolResult, SPECIAL_RESULT_TOOLS } from './tool-result-handler';
import { ClientTimestamp } from './ui/client-timestamp';

// Compact shimmer component for reasoning
const ReasoningShimmer = memo(function ReasoningShimmer({ content, tokens, isComplete, children }: { content: string; tokens?: number; isComplete?: boolean; children?: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-blue-50 rounded text-sm text-blue-700 mb-2 p-2">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 rounded p-1 -m-1 min-w-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronDown
          className={`w-3 h-3 text-blue-600 transition-transform duration-200 flex-shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
        />
        <div className="flex space-x-1 flex-shrink-0">
          <div className={`w-1 h-1 bg-blue-400 rounded-full ${!isComplete ? 'animate-pulse' : ''}`}></div>
          <div className={`w-1 h-1 bg-blue-400 rounded-full ${!isComplete ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.2s' }}></div>
          <div className={`w-1 h-1 bg-blue-400 rounded-full ${!isComplete ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-xs font-semibold truncate flex-1 min-w-0">{content}</span>
        {tokens !== undefined && <span className="text-xs text-blue-500 ml-auto flex-shrink-0">{tokens} tokens</span>}
      </div>
      {children && !isCollapsed && <div className="mt-2 pl-2 sm:pl-4 border-l-2 border-blue-200">{children}</div>}
    </div>
  );
});

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
  resultData?: any; // Store the tool result data for special rendering
}

// Reasoning state management
interface ReasoningState {
  isActive: boolean;
  text: string;
  tokens: number;
  isComplete: boolean;
  completeText?: string;
  tools: ToolState[];
}




// Pure function for parsing tool content - memoized at the component level
function parseToolContent(content: string) {
  const elements: Array<{ type: 'text' | 'status' | 'tool' | 'reasoning'; content: any }> = [];
  const standaloneTools = new Map<string, ToolState>();
  // Track all tool markers seen during this parse to handle re-parsing correctly
  const toolMarkers = new Map<string, Array<{ action: string; text: string; progress?: number }>>();

  const parts = content.split(/(\n?\{% [^%]+? %\}\n?)/g).filter(p => p && p.trim());



  for (const part of parts) {
    const match = part.match(/^\n?\{% ([^"]+?) "([^"]*)"(?: (\d+))? %\}\n?$/);

    if (!match) {
      // Check if this text contains special tool result data and separate it from trailing text
      let toolFound = false;

      // Try each special tool type to see if this text contains result data
      for (const specialToolName of SPECIAL_RESULT_TOOLS) {
        const extraction = extractToolResult(specialToolName, part);
        
        if (extraction) {
          // Find the most recent tool of this type and attach the data
          // First check standalone tools in elements array
          for (let i = elements.length - 1; i >= 0; i--) {
            if (elements[i].type === 'tool' && elements[i].content.name === specialToolName) {
              elements[i].content.resultData = extraction.resultData;
              toolFound = true;
              break;
            }
          }

          // If not found in standalone tools, check nested tools within reasoning blocks
          if (!toolFound) {
            for (let i = elements.length - 1; i >= 0; i--) {
              if (elements[i].type === 'reasoning') {
                const reasoningState = elements[i].content as ReasoningState;
                for (let j = reasoningState.tools.length - 1; j >= 0; j--) {
                  if (reasoningState.tools[j].name === specialToolName) {
                    reasoningState.tools[j].resultData = extraction.resultData;
                    toolFound = true;
                    break;
                  }
                }
                if (toolFound) break;
              }
            }
          }

          // If we successfully found and attached the data, push the remaining text separately
          if (toolFound) {
            if (extraction.remainingText && extraction.remainingText.trim()) {
              elements.push({ type: 'text', content: extraction.remainingText });
            }
            break; // Found and processed, stop checking other tool types
          }
        }
      }

      // If no special tool result was found (or no tool to attach it to), push the original part
      if (!toolFound) {
        elements.push({ type: 'text', content: part });
      }
      continue;
    }

    const [, fullCommand, text, progress] = match;
    const commandParts = fullCommand.trim().split('_');
    const action = commandParts.pop()!;
    const toolName = commandParts.join('_');


    if (fullCommand === 'status') {
      elements.push({ type: 'status', content: text });
      continue;
    }

    // Track tool markers for this parse
    if (toolName !== 'reasoning') {
      if (!toolMarkers.has(toolName)) {
        toolMarkers.set(toolName, []);
      }
      toolMarkers.get(toolName)!.push({ action, text, progress: progress ? parseInt(progress) : undefined });
    }

    let activeReasoningIndex = -1;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i].type === 'reasoning' && !elements[i].content.isComplete) {
        activeReasoningIndex = i;
        break;
      }
    }
    const activeReasoningState = activeReasoningIndex !== -1 ? elements[activeReasoningIndex].content : null;


    if (toolName === 'reasoning') {
      if (action === 'start') {
        if (activeReasoningState) {
          // If a reasoning block is already active, just update its text.
          // This handles redundant 'start' signals.
          activeReasoningState.text = text;
        } else {
          // Otherwise, create a new reasoning block
          elements.push({
            type: 'reasoning',
            content: { isActive: true, text, tokens: 0, isComplete: false, tools: [] }
          });
        }
      } else if (activeReasoningState) {
        if (action === 'progress') {
          activeReasoningState.text = text;
          activeReasoningState.tokens = parseInt(progress || '0');
        } else if (action === 'complete') {
          activeReasoningState.isComplete = true;
          activeReasoningState.completeText = text;
        }
      }
    } else { // It's a regular tool
      if (activeReasoningState) { // Nested tool
        let tool = activeReasoningState.tools.find((t: ToolState) => t.name === toolName && !t.isComplete);
        if (action === 'start' && !tool) {
          activeReasoningState.tools.push({ name: toolName, description: text, progressSteps: [], isComplete: false });
        } else if (tool) {
          if (action === 'progress') {
            tool.progressSteps.push({ text, progress: parseInt(progress || '0') });
          } else if (action === 'complete') {
            tool.isComplete = true;
            tool.completeText = text;
          }
        }
      } else { // Standalone tool
        if (action === 'start') {
          standaloneTools.set(toolName, { name: toolName, description: text, progressSteps: [], isComplete: false });
        } else {
          let tool = standaloneTools.get(toolName);

          // If tool doesn't exist but we have markers for it, reconstruct it from markers
          if (!tool && toolMarkers.has(toolName)) {
            const markers = toolMarkers.get(toolName)!;
            const startMarker = markers.find(m => m.action === 'start');
            if (startMarker) {
              tool = {
                name: toolName,
                description: startMarker.text,
                progressSteps: [],
                isComplete: false
              };
              // Apply all progress markers
              markers.filter(m => m.action === 'progress').forEach(m => {
                tool!.progressSteps.push({ text: m.text, progress: m.progress || 0 });
              });
              standaloneTools.set(toolName, tool);
            }
          }

          if (tool) {
            if (action === 'progress') {
              tool.progressSteps.push({ text, progress: parseInt(progress || '0') });
            } else if (action === 'complete') {
              tool.isComplete = true;
              tool.completeText = text;
              // Try to parse result data for special tools
              if (toolName === 'create_flight_itinerary') {
                try {
                  // The result data might be embedded in the text or we need to get it from the next element
                  // For now, we'll set a flag to look for it in the next text element
                  tool.resultData = { lookForData: true };
                } catch (e) {
                  // Ignore parsing errors
                }
              }
              elements.push({ type: 'tool', content: tool });
              // Don't delete from standaloneTools to handle re-parsing correctly
            }
          }
        }
      }
    }
  }

  // Add any incomplete standalone tools
  for (const tool of standaloneTools.values()) {
    if (!tool.isComplete) {
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
  return (
    <div className="prose prose-sm prose-neutral max-w-none break-words prose-headings:font-semibold prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium prose-code:break-words prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:overflow-x-auto prose-pre:text-sm prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Skip some heavy processing during active streaming for very long content
        skipHtml={isStreaming && content.length > 50}
      >
        {content}
      </ReactMarkdown>
    </div>
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
    // BUT always parse if content contains tool/reasoning syntax
    if (isStreaming && message.content.length < 100 && !message.content.includes('{% ')) {
      return [{ type: 'text' as const, content: message.content }];
    }

    return parseToolContent(message.content);
  }, [message.content, isUser, isStreaming]);

  return (
    <div className={cn(
      "group w-full text-gray-800 border-b border-gray-100",
      isUser ? "bg-gray-50" : "bg-white"
    )}>
      <div className="flex gap-3 sm:gap-4 p-4 sm:p-6 max-w-full mx-auto">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
            isUser
              ? "bg-blue-600 text-white"
              : "bg-green-600 text-white"
          )}>
            {isUser ? (
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {isUser ? 'You' : 'Travel Assistant'}
            </span>
            {message.createdAt && (
              <ClientTimestamp date={message.createdAt} />
            )}
          </div>

          <div className="prose prose-sm max-w-none prose-neutral">
            {isUser ? (
              // User messages stay as plain text
              <div className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </div>
            ) : (
              // Assistant messages with tool status and markdown rendering
              <div className="text-gray-900 leading-relaxed break-words space-y-2">
                {parsedContent.map((element, index) => {
                  if (element.type === 'status') {
                    return <StatusMessage key={index} content={element.content} />;
                  }

                  if (element.type === 'reasoning') {
                    const reasoning = element.content as ReasoningState;
                    const displayText = reasoning.isComplete ? (reasoning.completeText || reasoning.text) : reasoning.text;
                    return (
                      <ReasoningShimmer
                        key={index}
                        content={displayText}
                        tokens={reasoning.tokens > 0 ? reasoning.tokens : undefined}
                        isComplete={reasoning.isComplete}
                      >
                        {reasoning.tools.length > 0 && (
                          <div className="space-y-2 py-2">
                            {reasoning.tools.map((tool, toolIndex) => {
                              // Check if this tool has special result rendering
                              const specialResult = tool.isComplete && tool.resultData ? 
                                renderToolResult(tool.name, tool.resultData) : null;

                              if (specialResult) {
                                return (
                                  <div key={`${tool.name}-${toolIndex}`}>
                                    {specialResult}
                                  </div>
                                );
                              }

                              // Default tool progress rendering
                              return (
                                <ToolProgress
                                  key={`${tool.name}-${toolIndex}`}
                                  toolName={tool.name}
                                  description={tool.description}
                                  progress={tool.progressSteps[tool.progressSteps.length - 1]?.progress || 0}
                                  progressText={tool.progressSteps[tool.progressSteps.length - 1]?.text}
                                  isComplete={tool.isComplete}
                                  completeText={tool.completeText}
                                />
                              );
                            })}
                          </div>
                        )}
                      </ReasoningShimmer>
                    );
                  }

                  if (element.type === 'tool') {
                    const tool = element.content as ToolState;

                    // Check if this tool has special result rendering
                    const specialResult = tool.isComplete && tool.resultData ? 
                      renderToolResult(tool.name, tool.resultData) : null;

                    if (specialResult) {
                      return (
                        <div key={`${tool.name}-${index}`}>
                          {specialResult}
                        </div>
                      );
                    }

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