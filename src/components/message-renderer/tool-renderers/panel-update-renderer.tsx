'use client';

import * as React from 'react';
import { Settings, CheckCircle, AlertCircle, Map, FileText, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { parsePanelUpdateData } from '@/lib/parsers/tool-data-parser';

interface PanelUpdateRendererProps {
  data: {
    success: boolean;
    panelType?: string;
    action?: string;
    message?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

const getPanelIcon = (panelType?: string) => {
  switch (panelType) {
    case 'map': return <Map className="w-4 h-4" />;
    case 'text': return <FileText className="w-4 h-4" />;
    case 'code': return <Code className="w-4 h-4" />;
    default: return <Settings className="w-4 h-4" />;
  }
};

const getPanelTypeLabel = (panelType?: string) => {
  switch (panelType) {
    case 'map': return 'Map Panel';
    case 'text': return 'Text Panel';
    case 'code': return 'Code Panel';
    default: return panelType ? `${panelType} Panel` : 'Panel';
  }
};

export function PanelUpdateRenderer({ data }: PanelUpdateRendererProps) {
  const parsedData = parsePanelUpdateData(data);

  if (!parsedData.success) {
    return (
      <div className="p-3 flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        Panel update failed: {parsedData.message || 'Unknown error'}
      </div>
    );
  }

  // Extract panel data (exclude metadata)
  const { success, panelType, action, message, timestamp, ...panelData } = parsedData;
  const hasData = panelData && Object.keys(panelData || {}).length > 0;

  return (
    <Card className="p-3 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <CheckCircle className="w-4 h-4 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getPanelIcon(panelType)}
            <span className="text-sm font-medium text-blue-800">
              Updated {getPanelTypeLabel(panelType)}
            </span>
            {action && (
              <Badge variant="outline" className="text-xs">
                {action}
              </Badge>
            )}
          </div>

          {hasData && (
            <div className="mb-2">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                Data updated:
              </div>
              <div className="space-y-1">
                {Object.entries(panelData || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      {key}
                    </Badge>
                    <span className="text-muted-foreground truncate">
                      {typeof value === 'object'
                        ? `${Object.keys(value || {}).length} items`
                        : String(value).slice(0, 50)
                      }
                      {String(value).length > 50 && '...'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className="text-xs text-muted-foreground">
              {message}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 