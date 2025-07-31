'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  BarChart3,
  Target,
  TrendingUp,
  Copy,
  Clock,
  Award,
  Percent,
  Hash
} from 'lucide-react'

interface AnalysisTag {
  tag_id: string
  name: string
  type: string
  subtype: string
  query: {
    _tfidf: number
    _shared_entity_count: number
    _percentage_of_entities_tagged: number
    _score: number
    _percent_of_score: number
    _score_rank: number
    _score_percentile: number
    affinity: number
    rank: number
    percentile: number
  }
  value: string
}

interface AnalyzeEntitiesResult {
  success: boolean
  analysis: {
    tags: AnalysisTag[]
  }
  duration: number
}

interface AnalyzeEntitiesDisplayProps {
  content: string
}

function parseAnalyzeEntities(content: string): AnalyzeEntitiesResult | null {
  try {
    // Extract the analyze_entities tool result
    const analyzeMatch = content.match(/{% tool_complete 'analyze_entities'[^%]*%}[\s\S]*?{% tool_description %}[^%]*{% end_tool_description %}\s*([\s\S]*?){% endtool %}/);
    if (analyzeMatch && analyzeMatch[1]) {
      const jsonString = analyzeMatch[1].trim()
      const result = JSON.parse(jsonString)
      return result
    }
  } catch (e) {
    console.warn('Failed to parse analyze_entities:', e)
  }
  return null
}

function AnalysisTagCard({ tag, index }: { tag: AnalysisTag; index: number }) {
  const [expanded, setExpanded] = useState(false)

  const handleCopyTag = async () => {
    try {
      const tagData = JSON.stringify(tag, null, 2)
      await navigator.clipboard.writeText(tagData)
    } catch (err) {
      console.error('Failed to copy tag data:', err)
    }
  }

  const getSubtypeColor = (subtype: string) => {
    if (subtype.includes('wikipedia_category')) {
      return 'bg-blue-500'
    } else if (subtype.includes('genre')) {
      return 'bg-purple-500'
    } else if (subtype.includes('property')) {
      return 'bg-green-500'
    }
    return 'bg-gray-500'
  }

  const getSubtypeLabel = (subtype: string) => {
    if (subtype.includes('wikipedia_category')) {
      return 'CATEGORY'
    } else if (subtype.includes('genre')) {
      return 'GENRE'
    } else if (subtype.includes('property')) {
      return 'PROPERTY'
    }
    return subtype.replace('urn:property:', '').replace('_', ' ').toUpperCase()
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white'
    if (rank <= 3) return 'bg-orange-500 text-white'
    if (rank <= 5) return 'bg-blue-500 text-white'
    return 'bg-gray-500 text-white'
  }

  return (
    <Card className="mb-3 hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-purple-600">#{index + 1}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{tag.name}</span>
                    <Badge className={getScoreColor(tag.query.affinity)}>
                      <Target className="w-3 h-3 mr-1" />
                      {(tag.query.affinity * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className={`${getSubtypeColor(tag.subtype)} text-white text-xs px-2 py-1`}
                    >
                      {getSubtypeLabel(tag.subtype)}
                    </Badge>
                    <Badge 
                      className={`${getRankBadgeColor(tag.query.rank)} text-xs px-2 py-1`}
                    >
                      <Award className="w-3 h-3 mr-1" />
                      Rank {tag.query.rank}
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
              onClick={handleCopyTag}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Score Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 border-b pb-1">Score Metrics</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Affinity Score:</span>
                <span className={getScoreColor(tag.query.affinity)}>
                  {(tag.query.affinity * 100).toFixed(2)}%
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-medium">TF-IDF Score:</span>
                <span>{tag.query._tfidf.toFixed(4)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Percent className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Score Percentile:</span>
                <span>{(tag.query._score_percentile * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Ranking & Stats */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 border-b pb-1">Ranking & Stats</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Score Rank:</span>
                <Badge variant="outline" className="text-xs">
                  {tag.query._score_rank} of {tag.query.rank}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-indigo-500" />
                <span className="font-medium">Entity Coverage:</span>
                <span>{(tag.query._percentage_of_entities_tagged * 100).toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                <span className="font-medium">Shared Entities:</span>
                <span>{tag.query._shared_entity_count}</span>
              </div>
            </div>
          </div>

          {/* Tag ID */}
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium text-gray-700 block mb-2">Tag Identifier:</span>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto">
              {tag.tag_id}
            </div>
          </div>

          {/* Full Query Data */}
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium text-gray-700 block mb-2">Query Metrics:</span>
            <div className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-32">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(tag.query, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function AnalyzeEntitiesDisplay({ content }: AnalyzeEntitiesDisplayProps) {
  const result = parseAnalyzeEntities(content)
  
  if (!result || !result.success || !result.analysis?.tags?.length) {
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

  // Sort tags by affinity score (highest first)
  const sortedTags = [...result.analysis.tags].sort((a, b) => b.query.affinity - a.query.affinity)

  // Get average affinity score
  const avgAffinity = result.analysis.tags.reduce((sum, tag) => sum + tag.query.affinity, 0) / result.analysis.tags.length

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold">Entity Analysis</h3>
          <Badge variant="secondary" className="text-sm">
            {result.analysis.tags.length} tags
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{(result.duration * 1000).toFixed(0)}ms</span>
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

      {/* Summary Stats */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-xs">
          <Target className="w-3 h-3 mr-1" />
          Avg Affinity: {(avgAffinity * 100).toFixed(1)}%
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Analysis completed in {(result.duration * 1000).toFixed(0)}ms
        </Badge>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        {sortedTags.map((tag, index) => (
          <AnalysisTagCard key={tag.tag_id || index} tag={tag} index={index} />
        ))}
      </div>
    </div>
  )
} 