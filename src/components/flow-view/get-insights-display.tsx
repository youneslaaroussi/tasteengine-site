'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  Lightbulb,
  Star,
  Copy,
  Clock,
  BarChart3
} from 'lucide-react'

interface InsightEntity {
  name: string
  entity_id: string
  type: string
  subtype: string
  properties: string // JSON string
  popularity: number
  tags: string // JSON string  
  query: string // JSON string
  disambiguation: string
  external: string // JSON string
}

interface GetInsightsResult {
  success: boolean
  results: InsightEntity[]
  query: {
    explainability: Record<string, any>
  }
  duration: number
}

interface GetInsightsDisplayProps {
  content: string
}

function parseGetInsights(content: string): GetInsightsResult | null {
  try {
    // Extract the get_insights tool result
    const insightsMatch = content.match(/{% tool_complete 'get_insights'[^%]*%}[\s\S]*?{% tool_description %}[^%]*{% end_tool_description %}\s*([\s\S]*?){% endtool %}/);
    if (insightsMatch && insightsMatch[1]) {
      const jsonString = insightsMatch[1].trim()
      const result = JSON.parse(jsonString)
      return result
    }
  } catch (e) {
    console.warn('Failed to parse get_insights:', e)
  }
  return null
}

function InsightEntityCard({ entity, index }: { entity: InsightEntity; index: number }) {
  const [expanded, setExpanded] = useState(false)

  const handleCopyEntity = async () => {
    try {
      const entityData = JSON.stringify(entity, null, 2)
      await navigator.clipboard.writeText(entityData)
    } catch (err) {
      console.error('Failed to copy entity data:', err)
    }
  }

  const getSubtypeColor = (subtype: string) => {
    switch (subtype) {
      case 'urn:entity:brand':
        return 'bg-blue-500'
      case 'urn:entity:person':
        return 'bg-green-500'
      case 'urn:entity:place':
        return 'bg-purple-500'
      case 'urn:entity:organization':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSubtypeLabel = (subtype: string) => {
    return subtype.replace('urn:entity:', '').replace('_', ' ').toUpperCase()
  }

  return (
    <Card className="mb-3 hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-600">#{index + 1}</span>
                <div>
                  <div className="flex items-center gap-2">
                    {entity.name}
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      {(entity.popularity * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className={`${getSubtypeColor(entity.subtype)} text-white text-xs px-2 py-1`}
                    >
                      {getSubtypeLabel(entity.subtype)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyEntity}
              className="text-gray-500 hover:text-gray-700"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Entity ID:</span>
              <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">{entity.entity_id}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <div className="text-gray-600 mt-1">{entity.type}</div>
            </div>
          </div>

          {entity.properties && entity.properties !== '{}' && (
            <div>
              <span className="font-medium text-gray-700 block mb-2">Properties:</span>
              <div className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-32">
                <pre className="whitespace-pre-wrap">{entity.properties}</pre>
              </div>
            </div>
          )}

          {entity.tags && entity.tags !== '[]' && (
            <div>
              <span className="font-medium text-gray-700 block mb-2">Tags:</span>
              <div className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-32">
                <pre className="whitespace-pre-wrap">{entity.tags}</pre>
              </div>
            </div>
          )}

          {entity.external && entity.external !== '{}' && (
            <div>
              <span className="font-medium text-gray-700 block mb-2">External Data:</span>
              <div className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-32">
                <pre className="whitespace-pre-wrap">{entity.external}</pre>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function GetInsightsDisplay({ content }: GetInsightsDisplayProps) {
  const result = parseGetInsights(content)
  
  if (!result || !result.success) {
    return null
  }

  const handleCopyResult = async () => {
    try {
      const resultData = JSON.stringify(result, null, 2)
      await navigator.clipboard.writeText(resultData)
    } catch (err) {
      console.error('Failed to copy result data:', err)
    }
  }

  // Filter out "[...X more items]" entries
  const validEntities = result.results.filter(item => 
    typeof item === 'object' && item !== null && 'name' in item
  )

  const truncatedCount = result.results.length - validEntities.length
  const hasMoreItems = truncatedCount > 0

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold">Insights Results</h3>
          <Badge variant="secondary" className="text-sm">
            {validEntities.length} entities
          </Badge>
          {hasMoreItems && (
            <Badge variant="outline" className="text-sm">
              +{truncatedCount} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{result.duration}ms</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyResult}
            className="text-gray-500 hover:text-gray-700"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Performance Badge */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-green-600" />
        <Badge variant="outline" className="text-xs">
          Query completed in {result.duration}ms
        </Badge>
      </div>

      {/* Entities */}
      <div className="space-y-3">
        {validEntities.map((entity, index) => (
          <InsightEntityCard key={entity.entity_id || index} entity={entity} index={index} />
        ))}
      </div>

      {/* Query Info */}
      {result.query?.explainability && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Query Explainability
          </h4>
          <div className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(result.query.explainability, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
} 