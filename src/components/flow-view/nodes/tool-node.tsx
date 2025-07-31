'use client'

import { NodeProps } from '@xyflow/react'
import { 
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react'
import { BaseNode } from './base-node'
import { toolRegistry } from '../tool-registry'

interface ToolNodeData extends Record<string, unknown> {
  label: string
  toolName?: string
  parameters?: Record<string, any>
  results?: any
  status?: 'pending' | 'executing' | 'completed' | 'error'
  startTime?: number
  endTime?: number
  duration?: number
  description?: string
}

export function ToolNode(props: NodeProps) {
  const data = props.data as ToolNodeData
  const toolName = (data.toolName || 'api_call') as string
  
  // Get tool configuration from registry
  const toolConfig = toolRegistry.getToolConfig(toolName)
  
  // Fallback configuration if tool not found in registry
  const config = toolConfig || {
    name: data.label || 'Unknown Tool',
    icon: HelpCircle,
    color: '#64748b',
    description: data.description || 'Unknown tool operation'
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return null
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  const getExpectedDuration = () => {
    if (data.status === 'executing' && toolConfig?.expectedDuration) {
      return formatDuration(toolConfig.expectedDuration)
    }
    return null
  }

  return (
    <BaseNode
      {...props}
      data={{
        ...data,
        icon: config.icon,
        color: config.color,
        description: config.description
      }}
    >
      {/* Tool Info */}
      {toolConfig && (
        <div className="bg-gray-50 rounded p-2 text-xs border border-gray-200 mb-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">{config.name}</span>
            <span className="text-gray-500 capitalize">{toolConfig.category}</span>
          </div>
        </div>
      )}

      {/* Parameters */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div className="bg-gray-50 rounded p-2 text-xs border border-gray-200 mb-2">
          <div className="font-medium text-gray-700 mb-1">Parameters:</div>
          <div className="space-y-0.5">
            {Object.entries(data.parameters).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex items-start gap-1">
                <span className="text-gray-500 min-w-0 truncate">{key}:</span>
                <span className="text-gray-700 font-medium truncate">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
            {Object.keys(data.parameters).length > 3 && (
              <div className="text-gray-500 text-center">
                +{Object.keys(data.parameters).length - 3} more params
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executing Status */}
      {data.status === 'executing' && (
        <div className="bg-blue-50 rounded p-2 text-xs border border-blue-200 mb-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="font-medium text-blue-700">Processing...</span>
          </div>
          {getExpectedDuration() && (
            <div className="text-blue-600">
              Expected: ~{getExpectedDuration()}
            </div>
          )}
        </div>
      )}

      {/* Results Preview */}
      {data.results && data.status === 'completed' && (
        <div className="bg-green-50 rounded p-2 text-xs border border-green-200 mb-2">
          <div className="flex items-center gap-1 mb-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="font-medium text-green-700">Results:</span>
          </div>
          <div className="text-green-700">
            {typeof data.results === 'object' && data.results?.length !== undefined 
              ? `${data.results.length} items found`
              : typeof data.results === 'object' && data.results?.success
              ? 'Operation completed successfully'
              : 'Data retrieved'
            }
          </div>
        </div>
      )}

      {/* Error */}
      {data.status === 'error' && (
        <div className="bg-red-50 rounded p-2 text-xs border border-red-200 mb-2">
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            <span className="font-medium text-red-700">Error occurred</span>
          </div>
          {data.results?.error && (
            <div className="text-red-600 mt-1 truncate">
              {data.results.error}
            </div>
          )}
        </div>
      )}

      {/* Performance Info */}
      {data.duration && data.status === 'completed' && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(data.duration)}</span>
          </div>
          {toolConfig?.expectedDuration && (
            <div className={`text-xs ${
              data.duration <= toolConfig.expectedDuration 
                ? 'text-green-600' 
                : 'text-orange-600'
            }`}>
              {data.duration <= toolConfig.expectedDuration ? '⚡ Fast' : '🐌 Slow'}
            </div>
          )}
        </div>
      )}
    </BaseNode>
  )
} 