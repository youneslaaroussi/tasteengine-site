'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePanelData } from '@/hooks/use-panel-data'
import { useChatStore } from '@/stores/chat-store'
import { registerPanel } from '@/lib/panel-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Users, 
  Tags, 
  TrendingUp,
  BarChart3,
  Globe,
  Eye,
  RefreshCw,
  ExternalLink,
  Target,
  Building2,
  User,
  MapPin,
  Star,
  ArrowUpDown
} from 'lucide-react'

// Qloo Entity from backend
interface QlooEntity {
  entity_id: string
  name: string
  types?: string[]
  popularity?: number
  properties?: {
    short_description?: string
    description?: string
    address?: string
    website?: string
    official_site?: string
    phone?: string
    business_rating?: number
    headquartered?: string
  }
  location?: { lat: number; lon: number }
  disambiguation?: string
}

// Qloo Tag from backend
interface QlooTag {
  id: string
  name: string
  type?: string
}

// Qloo Audience from backend
interface QlooAudience {
  id: string
  name: string
  type?: string
  disambiguation?: string
}

// Qloo Insights Result from backend  
interface QlooInsightResult {
  entity?: QlooEntity
  affinity?: number
  popularity?: number
  name?: string
  id?: string
  subtype?: string
  type?: string
}

// Qloo Trending Data from backend
interface QlooTrendingPoint {
  date: string
  population_rank?: number
  population_percentile?: number
  population_rank_velocity?: number
}

// Qloo tool result types
interface QlooToolResult {
  toolName: string
  timestamp: number
  success?: boolean
  duration?: number
  
  // Entity search results
  entities?: QlooEntity[]
  
  // Tag search results
  tags?: QlooTag[]
  
  // Audience results
  audiences?: QlooAudience[]
  
  // Insights results
  results?: QlooInsightResult[]
  
  // Comparison results
  comparison?: {
    similarities?: QlooTag[]
  }
  
  // Trending results
  entity?: QlooEntity
  trendingData?: QlooTrendingPoint[]
  summary?: {
    overallTrend?: string
    averageRank?: number
    peakDate?: string
  }
  
  // Analysis results
  analysis?: any[]
  
  // Geocoding results
  matchedQuery?: string
  confidence?: number
  locality?: QlooEntity
  
  // Explanation results
  overallExplanation?: string
  topFactors?: Array<{
    entityName: string
    influence: number
    description: string
  }>
  
  // Generic data field for other results
  data?: any
}

interface QlooData {
  title: string
  results: QlooToolResult[]
  lastUpdated?: number
}

const defaultQlooData: QlooData = {
  title: 'Qloo Insights',
  results: []
}

const generateQlooTitle = (data: QlooData): string => {
  if (data.results.length === 0) return 'Qloo Insights'
  
  const recentResult = data.results[data.results.length - 1]
  const toolName = recentResult.toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return `Qloo: ${toolName}`
}

const getToolIcon = (toolName: string) => {
  if (toolName.includes('entities') || toolName.includes('search')) return <Search className="w-4 h-4" />
  if (toolName.includes('tags')) return <Tags className="w-4 h-4" />
  if (toolName.includes('audiences')) return <Users className="w-4 h-4" />
  if (toolName.includes('insights')) return <Eye className="w-4 h-4" />
  if (toolName.includes('trending')) return <TrendingUp className="w-4 h-4" />
  if (toolName.includes('compare')) return <ArrowUpDown className="w-4 h-4" />
  if (toolName.includes('analyze')) return <BarChart3 className="w-4 h-4" />
  if (toolName.includes('geocode')) return <MapPin className="w-4 h-4" />
  return <Target className="w-4 h-4" />
}

const getEntityTypeIcon = (type?: string) => {
  if (!type) return <Target className="w-3 h-3" />
  const cleanType = type.replace('urn:entity:', '')
  
  switch (cleanType) {
    case 'brand': return <Building2 className="w-3 h-3" />
    case 'person': return <User className="w-3 h-3" />
    case 'place': return <MapPin className="w-3 h-3" />
    case 'artist': return <Star className="w-3 h-3" />
    default: return <Target className="w-3 h-3" />
  }
}

const formatPopularity = (popularity?: number): string => {
  if (!popularity) return 'N/A'
  return `${(popularity * 100).toFixed(1)}%`
}

const formatToolName = (toolName: string): string => {
  return toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function QlooPanel() {
  const { currentSession: chatSession } = useChatStore()
  const [activeTab, setActiveTab] = useState<string>('all')

  const {
    data,
    save,
    clear,
    updateTitle,
  } = usePanelData<QlooData>({
    storeName: 'qloo-panel',
    defaultData: defaultQlooData,
    titleGenerator: generateQlooTitle,
    sessionKey: chatSession?.id,
  })

  // Register this panel type so it can be accessed by the agent
  useEffect(() => {
    if (chatSession?.id) {
      const { storeCache } = require('@/hooks/use-panel-data')
      const effectiveStoreName = `qloo-panel-${chatSession.id}`
      
      registerPanel(
        'qloo-panel',
        'qloo-panel',
        () => storeCache.get(effectiveStoreName),
        'Qloo insights and entity data for the current chat conversation'
      )
    }
  }, [chatSession?.id])

  // Function to add new Qloo result
  const addQlooResult = useCallback((result: QlooToolResult) => {
    const newData = {
      ...data,
      results: [...data.results, result],
      lastUpdated: Date.now()
    }
    save(newData)
    updateTitle()
  }, [data, save, updateTitle])

  // Expose the addQlooResult function globally so it can be called from tool handlers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addQlooResult = addQlooResult
    }
  }, [addQlooResult])

  const handleClear = useCallback(() => {
    save(defaultQlooData)
    updateTitle()
  }, [save, updateTitle])

  // Get unique tool types for tabs
  const toolTypes = ['all', ...Array.from(new Set(data.results.map((r: QlooToolResult) => {
    if (r.toolName.includes('entities') || r.toolName.includes('search')) return 'search'
    if (r.toolName.includes('tags')) return 'tags'
    if (r.toolName.includes('audiences')) return 'audiences'
    if (r.toolName.includes('insights')) return 'insights'
    if (r.toolName.includes('trending')) return 'trending'
    if (r.toolName.includes('compare')) return 'compare'
    return 'other'
  })))] as string[]

  const filteredResults = activeTab === 'all' 
    ? data.results 
    : data.results.filter((r: QlooToolResult) => {
        if (activeTab === 'search') return r.toolName.includes('entities') || r.toolName.includes('search')
        if (activeTab === 'tags') return r.toolName.includes('tags')
        if (activeTab === 'audiences') return r.toolName.includes('audiences')
        if (activeTab === 'insights') return r.toolName.includes('insights')
        if (activeTab === 'trending') return r.toolName.includes('trending')
        if (activeTab === 'compare') return r.toolName.includes('compare')
        return true
      })

  const renderEntityCard = (entity: QlooEntity, index: number) => (
    <Card key={entity.entity_id || index} className="mb-2">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getEntityTypeIcon(entity.types?.[0])}
            <span className="font-medium text-sm">{entity.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {entity.popularity && (
              <Badge variant="secondary" className="text-xs">
                {formatPopularity(entity.popularity)}
              </Badge>
            )}
            {entity.types && (
              <Badge variant="outline" className="text-xs">
                {entity.types[0].replace('urn:entity:', '')}
              </Badge>
            )}
          </div>
        </div>
        
        {entity.properties?.short_description && (
          <p className="text-xs text-gray-600 mb-2">{entity.properties.short_description}</p>
        )}
        
        <div className="flex flex-wrap gap-1">
          {entity.properties?.address && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {entity.properties.address.length > 20 
                ? entity.properties.address.substring(0, 20) + '...' 
                : entity.properties.address
              }
            </Badge>
          )}
          {entity.properties?.website && (
            <Badge variant="outline" className="text-xs cursor-pointer" 
                   onClick={() => window.open(entity.properties?.website, '_blank')}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Website
            </Badge>
          )}
          {entity.properties?.business_rating && (
            <Badge variant="outline" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              {entity.properties.business_rating}/5
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderToolResult = (result: QlooToolResult, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getToolIcon(result.toolName)}
            {formatToolName(result.toolName)}
          </div>
          <div className="flex items-center gap-2">
            {result.duration && (
              <Badge variant="outline" className="text-xs">
                {result.duration}ms
              </Badge>
            )}
            <Badge variant={result.success === false ? "destructive" : "default"} className="text-xs">
              {result.success === false ? 'Failed' : 'Success'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Entity Results */}
        {result.entities && result.entities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Entities ({result.entities.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.entities.slice(0, 5).map((entity, idx) => renderEntityCard(entity, idx))}
              {result.entities.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  ... and {result.entities.length - 5} more entities
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tag Results */}
        {result.tags && result.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Tags ({result.tags.length})
            </h4>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {result.tags.slice(0, 20).map((tag, idx) => (
                <Badge key={tag.id || idx} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {result.tags.length > 20 && (
                <Badge variant="outline" className="text-xs">
                  +{result.tags.length - 20} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Audience Results */}
        {result.audiences && result.audiences.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Audiences ({result.audiences.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {result.audiences.slice(0, 10).map((audience, idx) => (
                <div key={audience.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <span className="font-medium">{audience.name}</span>
                  {audience.type && (
                    <Badge variant="outline" className="text-xs">
                      {audience.type.replace('urn:audience:', '')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Results */}
        {(result.results && result.results.length > 0) || (result.data?.results && result.data.results.length > 0) ? (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Insights ({(result.results || result.data?.results || []).length})
            </h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(result.results || result.data?.results || []).slice(0, 10).map((insight: any, idx: number) => {
                // Handle both direct insight objects and nested entity objects
                const entity = insight.entity || insight
                const affinity = insight.affinity || (entity as any).affinity || entity.popularity
                const entityType = entity.subtype || entity.type || insight.subtype || insight.type
                const entityName = entity.name || insight.name
                return (
                  <div key={entity.entity_id || entity.id || insight.entity_id || idx} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                    <div className="flex items-center gap-2">
                      {getEntityTypeIcon(entityType)}
                      <span className="font-medium">{entityName}</span>
                      {entity.disambiguation && entity.disambiguation.trim() && (
                        <span className="text-gray-500">({entity.disambiguation})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {affinity && (
                        <Badge variant="secondary" className="text-xs">
                          {typeof affinity === 'number' ? 
                            (affinity > 1 ? affinity.toFixed(3) : `${(affinity * 100).toFixed(1)}%`) : 
                            affinity
                          }
                        </Badge>
                      )}
                      {entityType && (
                        <Badge variant="outline" className="text-xs">
                          {entityType.replace('urn:entity:', '')}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
              {(result.results || result.data?.results || []).length > 10 && (
                <p className="text-xs text-gray-500 text-center">
                  ... and {(result.results || result.data?.results || []).length - 10} more insights
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Trending Results */}
        {result.trendingData && result.trendingData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending Data
            </h4>
            {result.entity && (
              <div className="mb-2 p-2 bg-green-50 rounded">
                <span className="text-sm font-medium">{result.entity.name}</span>
                {result.summary && (
                  <div className="flex gap-2 mt-1">
                    {result.summary.overallTrend && (
                      <Badge variant="secondary" className="text-xs">
                        {result.summary.overallTrend}
                      </Badge>
                    )}
                    {result.summary.averageRank && (
                      <Badge variant="outline" className="text-xs">
                        Avg Rank: {result.summary.averageRank.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1 text-xs">
                {result.trendingData.slice(-10).map((point, idx) => (
                  <div key={idx} className="p-1 bg-gray-50 rounded">
                    <div className="font-mono">{point.date}</div>
                    {point.population_rank && (
                      <div>Rank: {point.population_rank}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {result.comparison?.similarities && result.comparison.similarities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Shared Characteristics ({result.comparison.similarities.length})
            </h4>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {result.comparison.similarities.slice(0, 15).map((tag, idx) => (
                <Badge key={tag.id || idx} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Explanation Results */}
        {result.overallExplanation && (
          <div>
            <h4 className="text-sm font-medium mb-2">Explanation</h4>
            <p className="text-xs text-gray-600 mb-2">{result.overallExplanation}</p>
            {result.topFactors && result.topFactors.length > 0 && (
              <div className="space-y-1">
                {result.topFactors.slice(0, 3).map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span>{factor.entityName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {(factor.influence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Geocoding Results */}
        {result.locality && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h4>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-medium text-sm">{result.locality.name}</div>
              {result.matchedQuery && (
                <div className="text-xs text-gray-600">Matched: {result.matchedQuery}</div>
              )}
              {result.confidence && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {(result.confidence * 100).toFixed(1)}% confidence
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Generic Data - only show if no other structured data is present */}
        {result.data && 
         !result.entities && 
         !result.tags && 
         !result.audiences && 
         !result.results && 
         !result.data?.results &&
         !result.trendingData && 
         !result.comparison &&
         !result.overallExplanation &&
         !result.locality ? (
          <div>
            <h4 className="text-sm font-medium mb-2">Result Data</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )

  if (!chatSession) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Start a chat to see Qloo insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          <h2 className="font-semibold text-lg">Qloo Insights</h2>
          {data.results.length > 0 && (
            <Badge variant="secondary">{data.results.length}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={data.results.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {toolTypes.length > 1 && (
        <div className="flex border-b bg-gray-50 px-4">
          {toolTypes.map((type: string) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === type
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Qloo results yet</h3>
              <p className="text-sm">
                Qloo tool results will appear here when you ask questions about brands, places, audiences, or insights.
              </p>
            </div>
          ) : (
            <div>
              {filteredResults.slice().reverse().map((result: QlooToolResult, index: number) => 
                renderToolResult(result, index)
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 