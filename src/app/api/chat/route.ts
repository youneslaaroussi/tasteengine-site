import { NextRequest } from 'next/server';
import { createDataStreamResponse } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    // Convert AI SDK messages to backend format
    const conversationHistory = messages.map((message: any) => ({
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString()
    }));
    
    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    
    // Create request body for your backend
    const backendRequest = {
      message: latestMessage.content,
      conversationHistory: conversationHistory.slice(0, -1), // Exclude the latest message as it's in the message field
    };
    
    return createDataStreamResponse({
      async execute(dataStream) {
        try {
          // Track active tool calls to properly close them
          const activeTools = new Set<string>();
          
          // Make request to your backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agent/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendRequest),
          });
          
          if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}`);
          }
          
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }
          
          const decoder = new TextDecoder();
          let buffer = '';
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // Close any remaining active tools when stream ends
                for (const toolName of activeTools) {
                  dataStream.write(`0:${JSON.stringify(`\n{% ${toolName}_end %}\n`)}\n`);
                }
                break;
              }
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              
              // Keep the last incomplete line in buffer
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6); // Remove 'data: ' prefix
                    const data = JSON.parse(jsonStr);
                    
                    // Handle different message types and embed them as markdown syntax
                    if (data.type === 'status') {
                      // Embed status updates as special markdown
                      const statusMarkdown = `\n{% status "${data.content}" %}\n`;
                      dataStream.write(`0:${JSON.stringify(statusMarkdown)}\n`);
                    }
                    
                    else if (data.type === 'reasoning_start') {
                      // Handle reasoning as a tool call
                      activeTools.add('reasoning');
                      const reasoningStartMarkdown = `\n{% reasoning_start "${data.content}" %}\n`;
                      dataStream.write(`0:${JSON.stringify(reasoningStartMarkdown)}\n`);
                    }
                    
                    else if (data.type === 'reasoning_progress') {
                      // Add reasoning progress update
                      const progressMarkdown = `{% reasoning_progress "${data.content}" ${data.reasoning?.tokens || 0} %}\n`;
                      dataStream.write(`0:${JSON.stringify(progressMarkdown)}\n`);
                    }
                    
                    else if (data.type === 'reasoning_complete') {
                      // Complete the reasoning block
                      activeTools.delete('reasoning');
                      const reasoningCompleteMarkdown = `{% reasoning_complete "${data.content}" %}\n\n`;
                      dataStream.write(`0:${JSON.stringify(reasoningCompleteMarkdown)}\n`);
                    }
                    
                    else if (data.type === 'tool_start') {
                      // Start a tool block
                      if (data.toolName) {
                        activeTools.add(data.toolName);
                        const toolStartMarkdown = `\n{% ${data.toolName}_start "${data.toolDescription || 'Executing tool...'}" %}\n`;
                        dataStream.write(`0:${JSON.stringify(toolStartMarkdown)}\n`);
                      }
                    }
                    
                    else if (data.type === 'tool_progress') {
                      // Add progress update to the tool
                      if (data.toolName) {
                        const progressMarkdown = `{% ${data.toolName}_progress "${data.content || 'Processing...'}" ${data.progress || 0} %}\n`;
                        dataStream.write(`0:${JSON.stringify(progressMarkdown)}\n`);
                      }
                    }
                    
                    else if (data.type === 'tool_complete') {
                      // Complete the tool block
                      if (data.toolName) {
                        activeTools.delete(data.toolName);
                        const toolCompleteMarkdown = `{% ${data.toolName}_complete "${data.content || 'Tool completed'}" %}\n\n`;
                        dataStream.write(`0:${JSON.stringify(toolCompleteMarkdown)}\n`);
                        
                        // For flight itinerary tool, also send the structured data
                        if (data.toolName === 'create_flight_itinerary' && data.data) {
                          const toolResultData = JSON.stringify(data.data);
                          dataStream.write(`0:${JSON.stringify(toolResultData)}\n`);
                        }
                      }
                    }
                    
                    // Handle regular content streaming
                    else if (data.type === 'content_stream' && data.content) {
                      dataStream.write(`0:${JSON.stringify(data.content)}\n`);
                    }
                    
                    // Handle completion
                    else if (data.type === 'done') {
                      // Close any remaining active tools
                      for (const toolName of activeTools) {
                        dataStream.write(`0:${JSON.stringify(`\n{% ${toolName}_end %}\n`)}\n`);
                      }
                      return;
                    }
                  } catch (parseError) {
                    console.error('Error parsing JSON:', parseError, 'Line:', line);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        } catch (error) {
          console.error('Stream error:', error);
          dataStream.write(`0:${JSON.stringify('Error: Unable to connect to travel agent service')}\n`);
        }
      },
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Fallback to a simple streaming response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const message = `I'm sorry, I'm having trouble connecting to the travel agent service. Please try again later.`;
        
        // Send the message in chunks to simulate streaming
        const chunks = message.split(' ');
        let i = 0;
        
        const interval = setInterval(() => {
          if (i < chunks.length) {
            const chunk = i === 0 ? chunks[i] : ' ' + chunks[i];
            controller.enqueue(encoder.encode(`0:${JSON.stringify({ type: 'text', value: chunk })}\n`));
            i++;
          } else {
            controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
            controller.close();
            clearInterval(interval);
          }
        }, 50);
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
} 