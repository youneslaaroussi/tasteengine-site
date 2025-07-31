'use client'

import { NodeProps } from '@xyflow/react'
import { Brain, Lightbulb } from 'lucide-react'
import { BaseNode } from './base-node'

interface AgentReasoningNodeData extends Record<string, unknown> {
  label: string
  reasoning?: string
  planedActions?: string[]
  status?: 'pending' | 'executing' | 'completed' | 'error'
  duration?: number
}

export function AgentReasoningNode(props: NodeProps) {
  const data = props.data as AgentReasoningNodeData
  
  return (
    <BaseNode
      {...props}
      data={{
        ...data,
        icon: Brain,
        color: '#8b5cf6',
      }}
    >
      {data.reasoning && (
        <div className="bg-purple-50 rounded p-2 text-xs text-purple-700 border border-purple-200">
          <div className="flex items-start gap-1">
            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div className="line-clamp-3">
              {data.reasoning}
            </div>
          </div>
        </div>
      )}
      
      {data.planedActions && data.planedActions.length > 0 && (
        <div className="mt-2 bg-white rounded p-2 text-xs border border-gray-200">
          <div className="font-medium text-gray-700 mb-1">Planned Actions:</div>
          <ul className="space-y-0.5">
            {data.planedActions.slice(0, 3).map((action: string, index: number) => (
              <li key={index} className="text-gray-600 flex items-start gap-1">
                <span className="text-purple-500 font-medium">{index + 1}.</span>
                <span className="truncate">{action}</span>
              </li>
            ))}
            {data.planedActions.length > 3 && (
              <li className="text-gray-500 text-center">
                +{data.planedActions.length - 3} more actions
              </li>
            )}
          </ul>
        </div>
      )}
    </BaseNode>
  )
} 