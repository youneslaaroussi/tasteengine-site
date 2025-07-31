'use client'

import { NodeProps } from '@xyflow/react'
import { User } from 'lucide-react'
import { BaseNode } from './base-node'

interface UserInputNodeData extends Record<string, unknown> {
  label: string
  message?: string
  status?: 'pending' | 'executing' | 'completed' | 'error'
  timestamp?: number
}

export function UserInputNode(props: NodeProps) {
  const data = props.data as UserInputNodeData
  
  return (
    <BaseNode
      {...props}
      data={{
        ...data,
        icon: User,
        color: '#10b981',
        showHandles: false // User input is always the start
      }}
    >
      {data.message && (
        <div className="bg-white rounded p-2 text-xs text-gray-700 border border-gray-200">
          <div className="line-clamp-3">
            {data.message}
          </div>
        </div>
      )}
    </BaseNode>
  )
} 