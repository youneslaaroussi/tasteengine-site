import { User, Bot, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StatusMessage, ToolProgress } from './tool-status';
import { FlightItineraryCard } from './flight-itinerary-card';

// Compact shimmer component for reasoning
const ReasoningShimmer = memo(function ReasoningShimmer({ content, tokens, isComplete, children }: { content: string; tokens?: number; isComplete?: boolean; children?: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="bg-blue-50 rounded text-sm text-blue-700 mb-2 p-2">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 rounded p-1 -m-1"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronDown 
          className={`w-3 h-3 text-blue-600 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} 
        />
        <div className="flex space-x-1">
          <div className={`w-1 h-1 bg-blue-400 rounded-full ${!isComplete ? 'animate-pulse' : ''}`}></div>
          <div className={`w-1 h-1 bg-blue-400 rounded-full ${!isComplete ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.2s' }}></div>
          <div className={`w-1 h-1 bg-blue-400 rounded-full ${!isComplete ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-xs font-semibold">{content}</span>
        {tokens !== undefined && <span className="text-xs text-blue-500 ml-auto">{tokens} tokens</span>}
      </div>
      {children && !isCollapsed && <div className="mt-2 pl-4 border-l-2 border-blue-200">{children}</div>}
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

// Helper function to normalize itinerary data structure, placed outside for clarity
const normalizeItineraryData = (data: any) => {
  // Ensure we have the required structure
  const normalized = {
    id: data.id || `itinerary_${Date.now()}`,
    createdAt: data.createdAt || new Date().toISOString(),
    travelerName: data.travelerName || 'Unknown Traveler',
    tripName: data.tripName || 'Flight Itinerary',
    notes: data.notes || '',
    summary: {
      totalFlights: 0,
      totalPrice: 0,
      currency: 'USD',
      destinations: '',
      origins: '',
      ...data.summary
    },
    flights: data.flights || [],
    metadata: {
      generatedBy: 'Travel Assistant',
      version: '1.0',
      format: 'json',
      ...data.metadata
    }
  };

  // Calculate summary data from flights if not provided
  if (normalized.flights.length > 0) {
    normalized.summary.totalFlights = normalized.flights.length;
    
    // Calculate total price
    if (normalized.summary.totalPrice === 0) {
      normalized.summary.totalPrice = normalized.flights.reduce((sum: number, flight: any) => {
        return sum + (flight.price?.amount || 0);
      }, 0);
    }
    
    // Get currency from first flight if not set
    if (normalized.summary.currency === 'USD' && normalized.flights[0]?.price?.currency) {
      normalized.summary.currency = normalized.flights[0].price.currency;
    }
    
    // Calculate destinations and origins
    if (!normalized.summary.destinations) {
      const destinations = new Set(normalized.flights.map((f: any) => f.destination?.code || f.destination?.city).filter(Boolean));
      normalized.summary.destinations = Array.from(destinations).join(', ');
    }
    
    if (!normalized.summary.origins) {
      const origins = new Set(normalized.flights.map((f: any) => f.origin?.code || f.origin?.city).filter(Boolean));
      normalized.summary.origins = Array.from(origins).join(', ');
    }
  }

  return normalized;
};


// Pure function for parsing tool content - memoized at the component level
function parseToolContent(content: string) {
  const elements: Array<{ type: 'text' | 'status' | 'tool' | 'reasoning'; content: any }> = [];
  const standaloneTools = new Map<string, ToolState>();

  const parts = content.split(/(\n?\{% [^%]+? %\}\n?)/g).filter(p => p && p.trim());
  
  // This function will find the first valid JSON object in the text
  // and return it along with the rest of the string.
  function extractJsonWithRemainingText(str: string): { json: string | null; remaining: string } {
    const startIndex = str.indexOf('{');
    if (startIndex === -1) return { json: null, remaining: str };

    let braceCount = 0;
    let inString = false;
    let endIndex = -1;

    for (let i = startIndex; i < str.length; i++) {
      const char = str[i];
      // Simple check for strings to ignore braces inside them
      if (char === '"' && (i === 0 || str[i - 1] !== '\\')) {
        inString = !inString;
      }
      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
      }
      if (braceCount === 0 && !inString && startIndex < i) {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) return { json: null, remaining: str };

    const jsonCandidate = str.substring(startIndex, endIndex + 1);
    try {
      JSON.parse(jsonCandidate);
      return { json: jsonCandidate, remaining: str.substring(endIndex + 1) };
    } catch (e) {
      // It looked like JSON, but wasn't valid. Treat as regular text.
      return { json: null, remaining: str };
    }
  }
  
  // Look for itinerary data in the content
  const extractItineraryData = (text: string) => {
    try {
      const { json: jsonText, remaining: remainingText } = extractJsonWithRemainingText(text);
      if (!jsonText) return null;

      const fullData = JSON.parse(jsonText);
      let itineraryPayload = null;

      // Check if it's a call wrapper structure (call_id: { success: true, itinerary: {...} })
      const callIds = Object.keys(fullData).filter(key => key.startsWith('call_'));
      if (callIds.length > 0) {
        const callData = fullData[callIds[0]];
        if (callData && callData.success && callData.itinerary) {
          itineraryPayload = {
            itinerary: normalizeItineraryData(callData.itinerary),
            json: callData.json
          };
        }
      }
      
      // Check if it's a direct itinerary object
      else if (fullData.id && fullData.id.startsWith('itinerary_')) {
        itineraryPayload = {
          itinerary: normalizeItineraryData(fullData),
          json: undefined
        };
      }
      
      // Handle any other structure that might contain itinerary data
      else if (fullData.itinerary) {
        itineraryPayload = {
          itinerary: normalizeItineraryData(fullData.itinerary),
          json: fullData.json
        };
      }
      
      // If the data looks like it might be an itinerary but doesn't have the expected structure
      else if (fullData.flights || fullData.travelerName || fullData.tripName) {
        itineraryPayload = {
          itinerary: normalizeItineraryData(fullData),
          json: undefined
        };
      }
      
      if (itineraryPayload) {
        return { ...itineraryPayload, remainingText };
      }
      
    } catch (e) {
      console.error('Error parsing itinerary data:', e);
    }
    return null;
  };

  for (const part of parts) {
    const match = part.match(/^\n?\{% ([^"]+?) "([^"]*)"(?: (\d+))? %\}\n?$/);

    if (!match) {
      // Check if this text contains itinerary data and separate it from trailing text
      const itineraryExtraction = extractItineraryData(part);
      
      if (itineraryExtraction) {
        const itineraryData = {
          itinerary: itineraryExtraction.itinerary,
          json: itineraryExtraction.json,
        };

        // Find the most recent create_flight_itinerary tool and attach the data
        let toolFound = false;
        
        // First check standalone tools in elements array
        for (let i = elements.length - 1; i >= 0; i--) {
          if (elements[i].type === 'tool' && elements[i].content.name === 'create_flight_itinerary') {
            elements[i].content.resultData = itineraryData;
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
                if (reasoningState.tools[j].name === 'create_flight_itinerary') {
                  reasoningState.tools[j].resultData = itineraryData;
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
          if (itineraryExtraction.remainingText && itineraryExtraction.remainingText.trim()) {
            elements.push({ type: 'text', content: itineraryExtraction.remainingText });
          }
          continue; // Skip adding the original part with JSON
        }
      }
      
      // If no itinerary was found (or no tool to attach it to), push the original part
      elements.push({ type: 'text', content: part });
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
          const tool = standaloneTools.get(toolName);
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
              standaloneTools.delete(toolName);
            }
          }
        }
      }
    }
  }

  // Add any incomplete standalone tools
  for (const tool of standaloneTools.values()) {
    elements.push({ type: 'tool', content: tool });
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
    <div className="prose prose-sm prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-900">
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

          <div className="prose prose-sm max-w-none prose-neutral">
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
                              // Special handling for flight itinerary tool within reasoning
                              if (tool.name === 'create_flight_itinerary' && tool.isComplete && tool.resultData) {
                                return (
                                  <div key={`${tool.name}-${toolIndex}`} className="mb-4">
                                    <FlightItineraryCard 
                                      itinerary={tool.resultData.itinerary || tool.resultData}
                                      json={tool.resultData.json}
                                    />
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
                    
                    // Special handling for flight itinerary tool
                    if (tool.name === 'create_flight_itinerary' && tool.isComplete && tool.resultData) {
                      return (
                        <div key={`${tool.name}-${index}`} className="mb-4">
                          <FlightItineraryCard 
                            itinerary={tool.resultData.itinerary || tool.resultData}
                            json={tool.resultData.json}
                          />
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