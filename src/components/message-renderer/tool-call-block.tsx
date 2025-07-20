
'use client';

import { memo } from 'react';
import { Plane, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCallContent } from '@/types/chat';
import { FlightResults } from '@/components/tool-result-handler';

interface ToolCallBlockProps {
  toolCall: ToolCallContent;
}

const getToolIcon = (tool: string) => {
  if (tool.includes('flight') || tool.includes('search')) {
    return <Plane className="w-4 h-4" />;
  }
  return <Clock className="w-4 h-4" />;
};

const getToolDisplayName = (tool: string) => {
    const toolNames: Record<string, string> = {
      'initiate_flight_search': 'Searching for flights',
      'search_bookable_flights': 'Finding bookable flights',
      'create_flight_itinerary': 'Creating itinerary',
      'validate_booking': 'Validating booking',
      'create_booking': 'Creating booking',
      'create_affiliate_links': 'Generating booking links',
      'save_to_memory': 'Save to memory',
    }
    return toolNames[tool] || tool.replace(/_/g, ' ')
};

export const ToolCallBlock = memo(({ toolCall }: ToolCallBlockProps) => {
  const { toolName, description, isComplete, data } = toolCall;

  const flightTools = ['search_bookable_flights', 'create_flight_itinerary', 'initiate_flight_search'];
  const shouldRenderFlightResults = flightTools.includes(toolName) && isComplete && data && data.flights;

  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border w-full',
          isComplete
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        )}
      >
        <div className="flex-shrink-0">
          {isComplete ? (
            getToolIcon(toolName)
          ) : (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-sm font-medium truncate">{getToolDisplayName(toolName)}</div>
          {description && (
            <div className="text-xs opacity-75 truncate">{description}</div>
          )}
        </div>
      </div>
      {shouldRenderFlightResults && <FlightResults data={data} />}
    </div>
  );
});

ToolCallBlock.displayName = 'ToolCallBlock';