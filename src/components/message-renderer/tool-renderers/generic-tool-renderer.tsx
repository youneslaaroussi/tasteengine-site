'use client';

import * as React from 'react';
import { CheckCircle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface GenericToolRendererProps {
  data: any;
  toolName: string;
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `Array (${value.length} items)`;
  if (typeof value === 'object') return `Object (${Object.keys(value).length} fields)`;
  return String(value);
};

const isImportantField = (key: string): boolean => {
  const importantFields = [
    'success', 'message', 'result', 'status', 'count', 'total', 
    'id', 'name', 'title', 'description', 'error', 'data'
  ];
  return importantFields.includes(key.toLowerCase());
};

export function GenericToolRenderer({ data, toolName }: GenericToolRendererProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        No result data
      </div>
    );
  }

  // Handle primitive values
  if (typeof data !== 'object') {
    return (
      <Card className="p-3 bg-green-50 border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">
            Result: {String(data)}
          </span>
        </div>
      </Card>
    );
  }

  const hasError = data.success === false || data.error;
  const entries = Object.entries(data);
  const importantEntries = entries.filter(([key]) => isImportantField(key));
  const otherEntries = entries.filter(([key]) => !isImportantField(key));

  return (
    <Card className={`p-3 ${hasError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <div className="space-y-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {hasError ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
          <span className={`text-sm font-medium ${hasError ? 'text-red-800' : 'text-green-800'}`}>
            {hasError ? 'Failed' : 'Completed'}
          </span>
        </div>

        {/* Important fields */}
        {importantEntries.length > 0 && (
          <div className="space-y-2">
            {importantEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-3">
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {key}
                </Badge>
                <span className="text-sm text-muted-foreground flex-1">
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Show details toggle for other fields */}
        {otherEntries.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 h-auto text-xs text-muted-foreground hover:text-foreground"
            >
              <motion.div
                animate={{ rotate: showDetails ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-3 h-3 mr-1" />
              </motion.div>
              {showDetails ? 'Hide' : 'Show'} {otherEntries.length} more field{otherEntries.length !== 1 ? 's' : ''}
            </Button>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 space-y-2"
                >
                  {otherEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3">
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {key}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex-1 font-mono">
                        {typeof value === 'object' 
                          ? JSON.stringify(value, null, 2)
                          : formatValue(value)
                        }
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
} 