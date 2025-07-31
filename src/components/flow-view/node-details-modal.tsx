'use client'

import { useState } from 'react'
import { X, Clock, CheckCircle, AlertCircle, Copy } from 'lucide-react'
import { Node } from '@xyflow/react'
import { toolRegistry } from './tool-registry'

interface NodeDetailsModalProps {
  node: Node | null
  isOpen: boolean
  onClose: () => void
}

interface NodeData {
  label?: string
  status?: 'pending' | 'executing' | 'completed' | 'error'
  description?: string
  toolName?: string
  parameters?: Record<string, any>
  results?: any
  reasoning?: string
  plannedActions?: string[]
  message?: string
  response?: string
  wordCount?: number
  duration?: number
  timestamp?: number
  messageId?: string
}

function JsonViewer({ data, maxHeight = '200px' }: { data: any; maxHeight?: string }) {
  const [isCopied, setIsCopied] = useState(false)
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-1 bg-white rounded border border-gray-300 hover:bg-gray-50 z-10"
        title="Copy to clipboard"
      >
        {isCopied ? (
          <CheckCircle className="w-3 h-3 text-green-600" />
        ) : (
          <Copy className="w-3 h-3 text-gray-600" />
        )}
      </button>
      <pre 
        className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        style={{ maxHeight }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export function NodeDetailsModal({ node, isOpen, onClose }: NodeDetailsModalProps) {
  if (!isOpen || !node) return null

  const data = node.data as NodeData
  const toolConfig = data.toolName ? toolRegistry.getToolConfig(data.toolName) : null

  const formatDuration = (duration?: number): string => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}m`
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'executing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getNodeTypeDisplayName = (type?: string): string => {
    const typeMap: Record<string, string> = {
      'user-input': 'User Input',
      'agent-reasoning': 'Agent Reasoning',
      'tool-qloo-entities': 'Qloo Entity Search',
      'tool-qloo-tags': 'Qloo Tag Search',
      'tool-qloo-insights': 'Qloo Insights',
      'tool-memory': 'Memory Tool',
      'tool-shopify': 'Shopify Tool',
      'tool-image-gen': 'Image Generation',
      'tool-search': 'Web Search',
      'final-response': 'Final Response'
    }
    return typeMap[type || ''] || type || 'Unknown'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getStatusIcon(data.status)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {data.label || 'Node Details'}
              </h2>
              <p className="text-sm text-gray-500">
                {getNodeTypeDisplayName(node.type)} • ID: {node.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
          
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Status:</label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(data.status)}
                  <span className="capitalize">{data.status || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700">Type:</label>
                <p className="mt-1">{getNodeTypeDisplayName(node.type)}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Position:</label>
                <p className="mt-1">({node.position.x}, {node.position.y})</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Duration:</label>
                <p className="mt-1">{formatDuration(data.duration)}</p>
              </div>
            </div>
            {data.description && (
              <div className="mt-4">
                <label className="font-medium text-gray-700">Description:</label>
                <p className="mt-1 text-gray-600">{data.description}</p>
              </div>
            )}
          </div>

          {/* Tool Configuration */}
          {toolConfig && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Tool Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Tool Name:</label>
                  <p className="mt-1">{toolConfig.name}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Category:</label>
                  <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                    {toolConfig.category}
                  </span>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Expected Duration:</label>
                  <p className="mt-1">{formatDuration(toolConfig.expectedDuration)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Success Rate:</label>
                  <p className="mt-1">
                    {toolConfig.successRate 
                      ? `${(toolConfig.successRate * 100).toFixed(1)}%` 
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <label className="font-medium text-gray-700">Description:</label>
                <p className="mt-1 text-gray-600">{toolConfig.description}</p>
              </div>
            </div>
          )}

          {/* Agent Reasoning */}
          {data.reasoning && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Agent Reasoning</h3>
              <div>
                <p className="text-gray-800 whitespace-pre-wrap">{data.reasoning}</p>
              </div>
              {data.plannedActions && Array.isArray(data.plannedActions) && (
                <div className="mt-4">
                  <label className="font-medium text-gray-700">Planned Actions:</label>
                  <ul className="mt-2 space-y-1">
                    {data.plannedActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <span className="text-purple-500 font-medium">{index + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          {(data.message || data.response) && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Content</h3>
              <div className="bg-white rounded p-3">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {data.message || data.response}
                </p>
                {data.wordCount && (
                  <p className="text-xs text-gray-500 mt-2">
                    Word count: {data.wordCount}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Parameters */}
          {data.parameters && Object.keys(data.parameters).length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Parameters</h3>
              <JsonViewer data={data.parameters} />
            </div>
          )}

          {/* Results */}
          {data.results && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Results</h3>
              <JsonViewer data={data.results} maxHeight="300px" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Position: ({node.position.x}, {node.position.y})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 