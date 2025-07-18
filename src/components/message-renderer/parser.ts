
import { ToolCallContent } from '@/types/chat';

export type ContentBlock = 
  | { type: 'text'; content: string }
  | { type: 'tool'; toolCall: ToolCallContent };

export function parseMessageContent(content: string): ContentBlock[] {
  const toolBlockRegex = /({% (tool_start|tool_complete) '([^']*)' '([^']*)' %})([\s\S]*?)(?:{% endtool %})/g;

  const blocks: ContentBlock[] = [];
  const toolCalls: { [id: string]: ToolCallContent } = {};
  let lastIndex = 0;
  let match;

  // First pass: identify all tool calls and group them
  while ((match = toolBlockRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const tag = match[1];
    const status = match[2];
    const toolName = match[3];
    const id = match[4];
    const innerContent = match[5];

    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    
    // Find or create the tool call object
    if (!toolCalls[id]) {
      toolCalls[id] = { id, toolName, description: '', isComplete: false, data: null };
      blocks.push({ type: 'tool', toolCall: toolCalls[id] });
    }

    const toolCall = toolCalls[id];

    if (status === 'tool_complete') {
      toolCall.isComplete = true;
      try {
        if(innerContent && innerContent.trim().startsWith('{')) {
          toolCall.data = JSON.parse(innerContent.trim());
        } else {
          toolCall.data = innerContent.trim();
        }
      } catch (e) {
        toolCall.data = innerContent.trim();
      }
    }

    // Extract description
    const descriptionMatch = innerContent.match(/{% tool_description %}([\s\S]*?){% end_tool_description %}/);
    if (descriptionMatch) {
      toolCall.description = descriptionMatch[1];
    }
    
    lastIndex = toolBlockRegex.lastIndex;
  }

  // Add any remaining text
  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.substring(lastIndex) });
  }

  // Clean up text blocks by removing the raw tool call syntax
  return blocks.map(block => {
    if (block.type === 'text') {
      return {
        ...block,
        content: block.content.replace(toolBlockRegex, '').trim(),
      };
    }
    return block;
  }).filter(block => block.type !== 'text' || block.content);
} 