'use client';

import * as React from 'react';
import { Save, CheckCircle, AlertCircle, Brain, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { parseMemoryToolData } from '@/lib/parsers/tool-data-parser';

interface MemoryToolRendererProps {
  data: {
    success: boolean;
    memory_id?: string;
    title?: string;
    content?: string;
    message?: string;
    timestamp?: string;
    action?: 'create' | 'update' | 'delete';
  };
  toolName: string;
}

export function MemoryToolRenderer({ data, toolName }: MemoryToolRendererProps) {
  const parsedData = parseMemoryToolData(data);
  
  if (!parsedData.success) {
    return (
      <div className="p-3 flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        {parsedData.message || 'Memory operation failed'}
      </div>
    );
  }

  const getActionLabel = (action?: string) => {
    switch (action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      default: return 'Saved';
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'create': return 'bg-green-50 text-green-700 border-green-200';
      case 'update': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delete': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <Card className={`p-3 border ${getActionColor(parsedData.action)}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <CheckCircle className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">
              {getActionLabel(parsedData.action)} memory
            </span>
            {parsedData.action && (
              <Badge variant="outline" className="text-xs">
                {parsedData.action}
              </Badge>
            )}
          </div>
          
          {parsedData.title && (
            <div className="mb-2">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                Title:
              </div>
              <div className="text-sm font-medium">{parsedData.title}</div>
            </div>
          )}
          
          {parsedData.content && (
            <div className="mb-2">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                Content:
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {parsedData.content}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {parsedData.memory_id && (
              <span>ID: {parsedData.memory_id.slice(0, 8)}...</span>
            )}
            {parsedData.timestamp && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(parsedData.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {parsedData.message && (
            <div className="mt-2 text-xs text-muted-foreground">
              {parsedData.message}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 