
'use client';

import * as React from 'react';
import { memo } from 'react';
import { 
  Plane, 
  Search,
  Database,
  Settings,
  Zap,
  Globe,
  Users,
  Calendar,
  MapPin,
  CreditCard,
  Link,
  Brain,
  Save,
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCallContent } from '@/types/campaign';
import { FlightResults } from '@/components/tool-result-handler';
import { ToolResultRenderer } from './tool-renderers';

interface ToolCallBlockProps {
  toolCall: ToolCallContent;
}

const getToolIcon = (tool: string) => {
  const iconMap: Record<string, React.JSX.Element> = {
    'initiate_flight_search': <Search className="w-4 h-4" />,
    'search_bookable_flights': <Plane className="w-4 h-4" />,
    'create_flight_itinerary': <Calendar className="w-4 h-4" />,
    'validate_booking': <CreditCard className="w-4 h-4" />,
    'create_booking': <CreditCard className="w-4 h-4" />,
    'create_affiliate_links': <Link className="w-4 h-4" />,
    'save_to_memory': <Save className="w-4 h-4" />,
    'update_panel': <Settings className="w-4 h-4" />,
    'search_entities': <Database className="w-4 h-4" />,
    'get_user_preferences': <Users className="w-4 h-4" />,
    'update_user_preferences': <Settings className="w-4 h-4" />,
    'search_locations': <MapPin className="w-4 h-4" />,
    'get_weather': <Globe className="w-4 h-4" />,
    'analyze_sentiment': <Brain className="w-4 h-4" />,
    'generate_image': <Image className="w-4 h-4" />,
    'create_image': <Image className="w-4 h-4" />,
    'image_generation': <Image className="w-4 h-4" />,
  };
  
  return iconMap[tool] || <Zap className="w-4 h-4" />;
};

const getToolDisplayName = (tool: string) => {
  const toolNames: Record<string, string> = {
    'initiate_flight_search': 'Searching for flights',
    'search_bookable_flights': 'Finding bookable flights', 
    'create_flight_itinerary': 'Creating itinerary',
    'validate_booking': 'Validating booking',
    'create_booking': 'Creating booking',
    'create_affiliate_links': 'Generating booking links',
    'generate_image': 'Generating image',
    'create_image': 'Creating image',
    'image_generation': 'Generating image',
    'save_to_memory': 'Saving to memory',
    'update_panel': 'Updating panel data',
    'search_entities': 'Searching entities',
    'get_user_preferences': 'Getting user preferences',
    'update_user_preferences': 'Updating preferences',
    'search_locations': 'Searching locations',
    'get_weather': 'Getting weather data',
    'analyze_sentiment': 'Analyzing sentiment',
  };
  return toolNames[tool] || tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const isImageGenerationTool = (toolName: string): boolean => {
  return ['generate_image', 'create_image', 'image_generation'].includes(toolName);
};

export const ToolCallBlock = memo(({ toolCall }: ToolCallBlockProps) => {
  const { toolName, isComplete, data } = toolCall;
  
  const flightTools = ['search_bookable_flights', 'create_flight_itinerary', 'initiate_flight_search'];
  const shouldRenderFlightResults = flightTools.includes(toolName) && isComplete && data && data.flights;
  const isImageTool = isImageGenerationTool(toolName);
  
  const hasError = data && data.success === false;
  
  return (
    <div className="w-full">
      {/* Ultra minimal tool call with icon */}
      <div className={cn(
        'flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400',
        !isComplete && 'animate-pulse'
      )}>
        {getToolIcon(toolName)}
        <span>
          {getToolDisplayName(toolName)}
          {isComplete && hasError && ' (failed)'}
        </span>
      </div>
      
      {/* Always show image generation results */}
      {isImageTool && isComplete && data && (
        <div className="mt-2">
          <ToolResultRenderer data={data} toolName={toolName} />
        </div>
      )}
      
      {/* Keep flight results as before */}
      {shouldRenderFlightResults && (
        <div className="mt-2">
          <FlightResults data={data} />
        </div>
      )}
    </div>
  );
});

ToolCallBlock.displayName = 'ToolCallBlock';