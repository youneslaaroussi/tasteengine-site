'use client';

import * as React from 'react';
import { SearchEntitiesRenderer } from './search-entities-renderer';
import { MemoryToolRenderer } from './memory-tool-renderer';
import { PanelUpdateRenderer } from './panel-update-renderer';
import { GenericToolRenderer } from './generic-tool-renderer';
import { ImageGenerationRenderer } from './image-generation-renderer';

export { SearchEntitiesRenderer, MemoryToolRenderer, PanelUpdateRenderer, GenericToolRenderer, ImageGenerationRenderer };

interface ToolRendererProps {
  data: any;
  toolName: string;
}

export function getToolRenderer(toolName: string): React.ComponentType<ToolRendererProps> {
  switch (toolName) {
    case 'search_entities':
      return SearchEntitiesRenderer;
    
    case 'save_to_memory':
    case 'update_memory':
    case 'delete_memory':
      return MemoryToolRenderer;
    
    case 'update_panel':
      return PanelUpdateRenderer;
    
    case 'generate_image':
    case 'create_image':
    case 'image_generation':
      return ImageGenerationRenderer;
    
    // Add more specific renderers here as needed
    case 'get_user_preferences':
    case 'update_user_preferences':
    case 'search_locations':
    case 'get_weather':
    case 'analyze_sentiment':
      return GenericToolRenderer;
    
    default:
      return GenericToolRenderer;
  }
}

// Main component that automatically selects the right renderer
export function ToolResultRenderer({ data, toolName }: ToolRendererProps) {
  const Renderer = getToolRenderer(toolName);
  return <Renderer data={data} toolName={toolName} />;
} 