'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, Eye, EyeOff, Settings, Download, Upload } from 'lucide-react'
import { Node } from '@xyflow/react'
import { toolRegistry } from './tool-registry'

interface FlowToolbarProps {
  nodes: Node[]
  onFilterChange: (filters: FilterState) => void
  onVisibilityToggle: (nodeIds: string[], visible: boolean) => void
  onExport?: () => void
  onImport?: () => void
}

export interface FilterState {
  searchTerm: string
  nodeTypes: string[]
  toolCategories: string[]
  statuses: string[]
  showOnlyActive: boolean
}

const defaultFilters: FilterState = {
  searchTerm: '',
  nodeTypes: [],
  toolCategories: [],
  statuses: [],
  showOnlyActive: false
}

export function FlowToolbar({ nodes, onFilterChange, onVisibilityToggle, onExport, onImport }: FlowToolbarProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Extract available options from nodes
  const availableOptions = useMemo(() => {
    const nodeTypes = new Set<string>()
    const toolCategories = new Set<string>()
    const statuses = new Set<string>()

    nodes.forEach(node => {
      if (node.type) nodeTypes.add(node.type)
      if (node.data?.status) statuses.add(node.data.status as string)
      
      // Get tool categories
      if (node.data?.toolName) {
        const toolConfig = toolRegistry.getToolConfig(node.data.toolName as string)
        if (toolConfig) toolCategories.add(toolConfig.category)
      }
    })

    return {
      nodeTypes: Array.from(nodeTypes).sort(),
      toolCategories: Array.from(toolCategories).sort(),
      statuses: Array.from(statuses).sort()
    }
  }, [nodes])

  // Filter nodes based on current filters
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matches = [
          node.data?.label,
          node.data?.description,
          node.data?.toolName,
          node.data?.message,
          node.data?.response,
          node.data?.reasoning
        ].some(field => 
          field && String(field).toLowerCase().includes(searchLower)
        )
        if (!matches) return false
      }

      // Node type filter
      if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(node.type || '')) {
        return false
      }

      // Tool category filter
      if (filters.toolCategories.length > 0) {
        const toolConfig = node.data?.toolName ? toolRegistry.getToolConfig(node.data.toolName as string) : null
        if (!toolConfig || !filters.toolCategories.includes(toolConfig.category)) {
          return false
        }
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(node.data?.status as string || '')) {
        return false
      }

      // Show only active filter
      if (filters.showOnlyActive && node.data?.status !== 'executing') {
        return false
      }

      return true
    })
  }, [nodes, filters])

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFilterChange(updated)
  }

  // Toggle filter category
  const toggleFilterArray = (category: keyof FilterState, value: string) => {
    const currentArray = filters[category] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    updateFilters({ [category]: newArray })
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  // Get filter summary
  const filterSummary = useMemo(() => {
    const activeFilters = []
    if (filters.searchTerm) activeFilters.push(`"${filters.searchTerm}"`)
    if (filters.nodeTypes.length > 0) activeFilters.push(`${filters.nodeTypes.length} types`)
    if (filters.toolCategories.length > 0) activeFilters.push(`${filters.toolCategories.length} categories`)
    if (filters.statuses.length > 0) activeFilters.push(`${filters.statuses.length} statuses`)
    if (filters.showOnlyActive) activeFilters.push('active only')
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : null
  }, [filters])

  // Node type display names
  const getNodeTypeDisplayName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'user-input': 'User Input',
      'agent-reasoning': 'Agent Reasoning',
      'tool-qloo-entities': 'Qloo Entities',
      'tool-qloo-tags': 'Qloo Tags',
      'tool-qloo-insights': 'Qloo Insights',
      'tool-memory': 'Memory',
      'tool-shopify': 'Shopify',
      'tool-image-gen': 'Image Gen',
      'tool-search': 'Web Search',
      'final-response': 'Response'
    }
    return typeMap[type] || type
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
      {/* Main Toolbar */}
      <div className="flex items-center gap-2 p-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${filterSummary ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
          title={filterSummary ? `Active filters: ${filterSummary}` : 'Open filters'}
        >
          <Filter className="w-4 h-4" />
        </button>

        {/* Results Count */}
        <div className="text-xs text-gray-500 px-2">
          {filteredNodes.length} of {nodes.length} nodes
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
          {/* Hide/Show All */}
          <button
            onClick={() => onVisibilityToggle(filteredNodes.map(n => n.id), false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Hide filtered nodes"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={() => onVisibilityToggle(filteredNodes.map(n => n.id), true)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Show filtered nodes"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Export/Import */}
          {onExport && (
            <button
              onClick={onExport}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Export flow"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onImport && (
            <button
              onClick={onImport}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Import flow"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 min-w-[300px]">
          {/* Node Types */}
          {availableOptions.nodeTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Node Types</label>
              <div className="flex flex-wrap gap-1">
                {availableOptions.nodeTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilterArray('nodeTypes', type)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      filters.nodeTypes.includes(type)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getNodeTypeDisplayName(type)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tool Categories */}
          {availableOptions.toolCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tool Categories</label>
              <div className="flex flex-wrap gap-1">
                {availableOptions.toolCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleFilterArray('toolCategories', category)}
                    className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${
                      filters.toolCategories.includes(category)
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Statuses */}
          {availableOptions.statuses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-1">
                {availableOptions.statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => toggleFilterArray('statuses', status)}
                    className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${
                      filters.statuses.includes(status)
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show Only Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showOnlyActive"
              checked={filters.showOnlyActive}
              onChange={(e) => updateFilters({ showOnlyActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="showOnlyActive" className="text-sm text-gray-700">
              Show only executing nodes
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 