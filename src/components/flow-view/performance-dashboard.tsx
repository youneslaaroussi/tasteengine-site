'use client'

import { useState, useMemo } from 'react'
import { BarChart3, Clock, Target, TrendingUp, TrendingDown, Activity, CheckCircle, XCircle, Zap } from 'lucide-react'
import { Node } from '@xyflow/react'
import { toolRegistry } from './tool-registry'

interface PerformanceDashboardProps {
  nodes: Node[]
  isOpen: boolean
  onClose: () => void
}

interface ToolMetrics {
  name: string
  category: string
  usageCount: number
  totalDuration: number
  averageDuration: number
  successRate: number
  errorCount: number
  fastestExecution: number
  slowestExecution: number
}

interface FlowMetrics {
  totalNodes: number
  completedNodes: number
  executingNodes: number
  errorNodes: number  
  totalDuration: number
  averageFlowTime: number
  toolsUsed: number
  qlooOperations: number
}

export function PerformanceDashboard({ nodes, isOpen, onClose }: PerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'flows' | 'insights'>('overview')

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const toolMetricsMap = new Map<string, ToolMetrics>()
    let totalFlowDuration = 0
    let completedFlows = 0
    let qlooOperations = 0
    let toolsUsed = 0

    // Process each node
    nodes.forEach(node => {
      const data = node.data
      const toolName = data?.toolName as string
      const duration = data?.duration as number || 0
      const status = data?.status as string

      // Count by status
      if (status === 'completed' && duration > 0) {
        totalFlowDuration += duration
        completedFlows++
      }

      // Track tool metrics
      if (toolName) {
        toolsUsed++
        
        if (toolName.includes('qloo') || node.type?.includes('qloo')) {
          qlooOperations++
        }

        const existing = toolMetricsMap.get(toolName) || {
          name: toolName,
          category: 'unknown',
          usageCount: 0,
          totalDuration: 0,
          averageDuration: 0,
          successRate: 0,
          errorCount: 0,
          fastestExecution: Infinity,
          slowestExecution: 0
        }

        existing.usageCount++
        existing.totalDuration += duration

        if (duration > 0) {
          existing.fastestExecution = Math.min(existing.fastestExecution, duration)
          existing.slowestExecution = Math.max(existing.slowestExecution, duration)
        }

        if (status === 'error') {
          existing.errorCount++
        }

        // Get tool configuration
        const toolConfig = toolRegistry.getToolConfig(toolName)
        if (toolConfig) {
          existing.category = toolConfig.category
        }

        toolMetricsMap.set(toolName, existing)
      }
    })

    // Calculate derived metrics
    toolMetricsMap.forEach((metrics, toolName) => {
      metrics.averageDuration = metrics.totalDuration / metrics.usageCount
      metrics.successRate = (metrics.usageCount - metrics.errorCount) / metrics.usageCount
      
      if (metrics.fastestExecution === Infinity) {
        metrics.fastestExecution = 0
      }
    })

    const toolMetrics = Array.from(toolMetricsMap.values()).sort((a, b) => b.usageCount - a.usageCount)

    const flowMetrics: FlowMetrics = {
      totalNodes: nodes.length,
      completedNodes: nodes.filter(n => n.data?.status === 'completed').length,
      executingNodes: nodes.filter(n => n.data?.status === 'executing').length,
      errorNodes: nodes.filter(n => n.data?.status === 'error').length,
      totalDuration: totalFlowDuration,
      averageFlowTime: completedFlows > 0 ? totalFlowDuration / completedFlows : 0,
      toolsUsed,
      qlooOperations
    }

    return { toolMetrics, flowMetrics }
  }, [nodes])

  // Format duration for display
  const formatDuration = (duration: number): string => {
    if (duration < 1000) return `${Math.round(duration)}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}m`
  }

  // Get performance insights
  const getInsights = () => {
    const insights = []
    const { toolMetrics, flowMetrics } = metrics

    // Slowest tools
    const slowestTool = toolMetrics.reduce((prev, current) => 
      prev.averageDuration > current.averageDuration ? prev : current, toolMetrics[0]
    )
    if (slowestTool) {
      insights.push({
        type: 'warning',
        title: 'Slowest Tool',
        description: `${slowestTool.name} averages ${formatDuration(slowestTool.averageDuration)}`,
        icon: Clock
      })
    }

    // Most used tool
    const mostUsedTool = toolMetrics[0]
    if (mostUsedTool) {
      insights.push({
        type: 'info',
        title: 'Most Used Tool',
        description: `${mostUsedTool.name} used ${mostUsedTool.usageCount} times`,
        icon: Target
      })
    }

    // Error rate
    const totalErrors = flowMetrics.errorNodes
    const errorRate = totalErrors / flowMetrics.totalNodes
    if (errorRate > 0.1) {
      insights.push({
        type: 'error',
        title: 'High Error Rate',
        description: `${(errorRate * 100).toFixed(1)}% of operations failed`,
        icon: XCircle
      })
    } else if (errorRate === 0) {
      insights.push({
        type: 'success',
        title: 'Perfect Success Rate',
        description: 'All operations completed successfully',
        icon: CheckCircle
      })
    }

    // Qloo usage
    if (flowMetrics.qlooOperations > 0) {
      insights.push({
        type: 'info',
        title: 'Qloo Integration',
        description: `${flowMetrics.qlooOperations} Qloo operations performed`,
        icon: TrendingUp
      })
    }

    return insights
  }

  const insights = getInsights()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Performance Dashboard</h2>
              <p className="text-sm text-gray-500">AI Workflow Analytics & Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'tools', label: 'Tools', icon: Target },
              { id: 'flows', label: 'Flows', icon: TrendingUp },
              { id: 'insights', label: 'Insights', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Nodes', value: metrics.flowMetrics.totalNodes, icon: Activity, color: 'blue' },
                  { label: 'Completed', value: metrics.flowMetrics.completedNodes, icon: CheckCircle, color: 'green' },
                  { label: 'Executing', value: metrics.flowMetrics.executingNodes, icon: Clock, color: 'orange' },
                  { label: 'Errors', value: metrics.flowMetrics.errorNodes, icon: XCircle, color: 'red' }
                ].map(metric => (
                  <div key={metric.label} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{metric.label}</p>
                        <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                      </div>
                      <metric.icon className={`w-8 h-8 text-${metric.color}-500`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Flow Summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Flow Performance</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Duration:</span>
                      <span className="font-medium">{formatDuration(metrics.flowMetrics.totalDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Flow Time:</span>
                      <span className="font-medium">{formatDuration(metrics.flowMetrics.averageFlowTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tools Used:</span>
                      <span className="font-medium">{metrics.flowMetrics.toolsUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qloo Operations:</span>
                      <span className="font-medium">{metrics.flowMetrics.qlooOperations}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Success Rate</h3>
                  <div className="relative pt-2">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-green-600">
                          {metrics.flowMetrics.totalNodes > 0 
                            ? ((metrics.flowMetrics.completedNodes / metrics.flowMetrics.totalNodes) * 100).toFixed(1)
                            : '0'
                          }%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div 
                        style={{ width: `${metrics.flowMetrics.totalNodes > 0 ? (metrics.flowMetrics.completedNodes / metrics.flowMetrics.totalNodes) * 100 : 0}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Tool Performance Analysis</h3>
              <div className="space-y-3">
                {metrics.toolMetrics.map(tool => (
                  <div key={tool.name} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{tool.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{tool.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{tool.usageCount} uses</p>
                        <p className="text-xs text-gray-500">{(tool.successRate * 100).toFixed(1)}% success</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Avg Duration</p>
                        <p className="font-medium">{formatDuration(tool.averageDuration)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fastest</p>
                        <p className="font-medium text-green-600">{formatDuration(tool.fastestExecution)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Slowest</p>
                        <p className="font-medium text-red-600">{formatDuration(tool.slowestExecution)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Performance Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className={`rounded-lg p-4 border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-400' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    insight.type === 'error' ? 'bg-red-50 border-red-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      <insight.icon className={`w-5 h-5 ${
                        insight.type === 'success' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-yellow-600' :
                        insight.type === 'error' ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 