
'use client';

import * as React from 'react';
import { memo, useState } from 'react';
import { 
  Plane, 
  Clock, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Search,
  Database,
  FileText,
  Settings,
  Zap,
  Globe,
  Users,
  Calendar,
  MapPin,
  CreditCard,
  Link,
  Brain,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { ToolCallContent } from '@/types/chat';
import { FlightResults } from '@/components/tool-result-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToolResultRenderer } from './tool-renderers';

interface ToolCallBlockProps {
  toolCall: ToolCallContent;
}

const getToolIcon = (tool: string) => {
  const iconMap: Record<string, React.JSX.Element> = {
    'initiate_flight_search': <Search className="w-4 h-4" />,
    'search_bookable_flights': <Plane className="w-4 h-4" />,
    'create_flight_itinerary': <Calendar className="w-4 h-4" />,
    'validate_booking': <CheckCircle className="w-4 h-4" />,
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

const getToolCategory = (tool: string): string => {
  if (tool.includes('flight') || tool.includes('booking')) return 'flight';
  if (tool.includes('search') || tool.includes('entities')) return 'search';
  if (tool.includes('memory') || tool.includes('save')) return 'memory';
  if (tool.includes('user') || tool.includes('preferences')) return 'user';
  if (tool.includes('panel') || tool.includes('update')) return 'system';
  return 'general';
};

const formatExecutionTime = (startTime?: string, endTime?: string): string => {
  if (!startTime || !endTime) return '';
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const duration = end - start;
  
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
};

const renderResultSummary = (data: any, toolName: string): string => {
  if (!data) return 'No result data';
  
  // Handle different tool result types
  if (toolName === 'search_entities' && data.entities) {
    return `Found ${data.entities.length} entities`;
  }
  
  if (toolName.includes('flight') && data.flights) {
    return `Found ${data.flights.length} flights`;
  }
  
  if (data.success !== undefined) {
    return data.success ? 'Completed successfully' : 'Failed';
  }
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return `Returned ${keys.length} field${keys.length !== 1 ? 's' : ''}`;
  }
  
  return 'Completed';
};

export const ToolCallBlock = memo(({ toolCall }: ToolCallBlockProps) => {
  const { toolName, description, isComplete, data } = toolCall;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const category = getToolCategory(toolName);
  const flightTools = ['search_bookable_flights', 'create_flight_itinerary', 'initiate_flight_search'];
  const shouldRenderFlightResults = flightTools.includes(toolName) && isComplete && data && data.flights;
  
  // Determine tool state
  const hasError = data && data.success === false;
  const hasResults = isComplete && data;
  
  // Color scheme based on state and category
  const getColorScheme = () => {
    if (hasError) {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        accent: 'text-red-600 dark:text-red-400'
      };
    }
    
    if (isComplete) {
      const schemes = {
        flight: {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800', 
          text: 'text-blue-800 dark:text-blue-200',
          accent: 'text-blue-600 dark:text-blue-400'
        },
        search: {
          bg: 'bg-purple-50 dark:bg-purple-950/20',
          border: 'border-purple-200 dark:border-purple-800',
          text: 'text-purple-800 dark:text-purple-200', 
          accent: 'text-purple-600 dark:text-purple-400'
        },
        memory: {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
          accent: 'text-green-600 dark:text-green-400'
        },
        system: {
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-800 dark:text-gray-200',
          accent: 'text-gray-600 dark:text-gray-400'
        },
        user: {
          bg: 'bg-indigo-50 dark:bg-indigo-950/20',
          border: 'border-indigo-200 dark:border-indigo-800',
          text: 'text-indigo-800 dark:text-indigo-200',
          accent: 'text-indigo-600 dark:text-indigo-400'
        },
        general: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-800 dark:text-emerald-200',
          accent: 'text-emerald-600 dark:text-emerald-400'
        }
      };
      return schemes[category as keyof typeof schemes] || schemes.general;
    }
    
    // Processing state
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      accent: 'text-amber-600 dark:text-amber-400'
    };
  };
  
  const colors = getColorScheme();

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={cn(
        'rounded-lg border transition-all duration-200',
        colors.bg,
        colors.border,
        colors.text
      )}>
        <div className="flex items-center gap-3 p-4">
          <div className="flex-shrink-0">
            <motion.div
              animate={!isComplete ? { rotate: 360 } : { rotate: 0 }}
              transition={!isComplete ? { 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              } : { duration: 0.3 }}
            >
              {isComplete ? (
                hasError ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </motion.div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getToolIcon(toolName)}
              <span className="text-sm font-semibold truncate">
                {getToolDisplayName(toolName)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            </div>
            
            {description && (
              <div className="text-xs opacity-80 truncate mb-2">
                {description}
              </div>
            )}
            
            {isComplete && (
              <div className="flex items-center gap-2 text-xs opacity-70">
                <span>{renderResultSummary(data, toolName)}</span>
                {data && data.timestamp && (
                  <span>• {formatExecutionTime(data.startTime, data.timestamp)}</span>
                )}
              </div>
            )}
          </div>
          
          {hasResults && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </Button>
          )}
        </div>
        
        <AnimatePresence>
          {hasResults && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-current/20"
            >
              <div className="p-4 pt-3">
                <ToolResultRenderer data={data} toolName={toolName} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {shouldRenderFlightResults && (
        <div className="mt-3">
          <FlightResults data={data} />
        </div>
      )}
    </motion.div>
  );
});

ToolCallBlock.displayName = 'ToolCallBlock';