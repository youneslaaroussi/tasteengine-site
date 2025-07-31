'use client'

import { NodeProps } from '@xyflow/react'
import { MessageCircle } from 'lucide-react'
import { BaseNode } from './base-node'

interface ResponseNodeData extends Record<string, unknown> {
  label: string
  response?: string
  status?: 'pending' | 'executing' | 'completed' | 'error'
  wordCount?: number
}

export function ResponseNode(props: NodeProps) {
  const data = props.data as ResponseNodeData
  
  return (
    <BaseNode
      {...props}
      data={{
        ...data,
        icon: MessageCircle,
        color: '#3b82f6',
        showHandles: false // Response is always the end
      }}
    >
      {data.response && (
        <div className="bg-blue-50 rounded p-2 text-xs text-blue-700 border border-blue-200">
          <div className="line-clamp-4">
            {data.response}
          </div>
          {data.wordCount && (
            <div className="text-blue-500 text-right mt-1">
              {data.wordCount} words
            </div>
          )}
        </div>
      )}
    </BaseNode>
  )
} 