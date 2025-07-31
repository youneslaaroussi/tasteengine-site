'use client'

import { Handle, Position, NodeProps } from '@xyflow/react'
import { LucideIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BaseNodeData extends Record<string, unknown> {
  label: string
  status?: 'pending' | 'executing' | 'completed' | 'error'
  description?: string
  icon?: LucideIcon
  color?: string
  showHandles?: boolean
}

interface BaseNodeProps extends NodeProps {
  data: BaseNodeData
  children?: React.ReactNode
}

const statusColors = {
  pending: 'border-gray-300 bg-gray-50',
  executing: 'border-blue-400 bg-blue-50 shadow-blue-100',
  completed: 'border-green-400 bg-green-50 shadow-green-100',
  error: 'border-red-400 bg-red-50 shadow-red-100'
}

const statusIconColors = {
  pending: 'text-gray-400',
  executing: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-red-500'
}

export function BaseNode({ data, children, selected, id }: BaseNodeProps) {
  const {
    label,
    status = 'pending',
    description,
    icon: Icon,
    color = '#6b7280',
    showHandles = true
  } = data

  return (
    <>
      {/* Input Handle */}
      {showHandles && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600"
        />
      )}

      <div
        className={cn(
          'relative min-w-[180px] rounded-lg border-2 shadow-lg transition-all duration-200',
          statusColors[status],
          selected && 'ring-2 ring-blue-400',
          status === 'executing' && 'shadow-lg'
        )}
        style={{
          boxShadow: status === 'executing' 
            ? '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-3 pb-2">
          {/* Icon */}
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: color }}
          >
            {status === 'executing' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon ? (
              <Icon className="w-4 h-4" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {label}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {description}
              </p>
            )}
          </div>

          {/* Status indicator */}
          <div className={cn('w-2 h-2 rounded-full', {
            'bg-gray-400': status === 'pending',
            'bg-blue-500 animate-pulse': status === 'executing',
            'bg-green-500': status === 'completed',
            'bg-red-500': status === 'error'
          })} />
        </div>

        {/* Content */}
        {children && (
          <div className="px-3 pb-3">
            {children}
          </div>
        )}

        {/* Execution indicator overlay */}
        {status === 'executing' && (
          <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-5 animate-pulse" />
        )}
      </div>

      {/* Output Handle */}
      {showHandles && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600"
        />
      )}
    </>
  )
} 