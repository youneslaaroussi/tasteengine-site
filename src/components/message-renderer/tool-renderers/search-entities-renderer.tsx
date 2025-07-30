'use client';

import * as React from 'react';
import { Database, ExternalLink, Globe, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { parseSearchEntitiesData } from '@/lib/parsers/tool-data-parser';

interface SearchEntitiesRendererProps {
  data: {
    success: boolean;
    entities?: Array<{
      name: string;
      entity_id: string;
      types: string[];
      properties?: {
        akas?: Array<{ language: string; value: string }>;
        [key: string]: any;
      };
    }>;
    query?: string;
    count?: number;
  };
}

export function SearchEntitiesRenderer({ data }: SearchEntitiesRendererProps) {
  // Parse data using the dedicated parser
  const parsedData = parseSearchEntitiesData(data);
  
  if (!parsedData.success || !parsedData.entities || parsedData.entities.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        No entities found
        <div className="text-xs mt-1 opacity-70">
          Debug: {JSON.stringify({
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : [],
            success: parsedData.success,
            entitiesLength: parsedData.entities?.length || 0
          })}
        </div>
      </div>
    );
  }

  const { entities } = parsedData;
  const topEntities = entities.slice(0, 5); // Show top 5 results

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Database className="w-3 h-3" />
        Found {entities.length} entities
        {entities.length > 5 && <span>• Showing top 5</span>}
      </div>
      
      <div className="space-y-2">
        {topEntities.map((entity: any, index: number) => (
          <Card key={entity.entity_id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-sm truncate">{entity.name}</h4>
                  {entity.types.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {entity.types[0].replace('urn:entity:', '')}
                    </Badge>
                  )}
                </div>
                
                {entity.properties?.akas && entity.properties.akas.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">
                      Also known as:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entity.properties.akas.slice(0, 3).map((aka: any, akaIndex: number) => (
                        <Badge key={akaIndex} variant="outline" className="text-xs">
                          <span className="text-muted-foreground mr-1">
                            {aka.language}:
                          </span>
                          {aka.value}
                        </Badge>
                      ))}
                      {entity.properties.akas.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{entity.properties.akas.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  ID: {entity.entity_id}
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="p-1">
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {entities.length > 5 && (
        <div className="text-center">
          <Button variant="outline" size="sm" className="text-xs">
            View all {entities.length} results
          </Button>
        </div>
      )}
    </div>
  );
} 