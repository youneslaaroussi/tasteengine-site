'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Building, 
  Calendar, 
  MapPin,
  Star,
  Tag,
  Globe,
  Users,
  Copy
} from 'lucide-react'

interface Entity {
  name: string
  entity_id: string
  types: string[]
  properties: {
    akas?: Array<{ language: string; value: string }>
    external?: {
      facebook?: { id: string }
      instagram?: { id: string }
      twitter?: { id: string }
      wikidata?: { id: string }
    }
    headquartered?: string
    image?: { url: string }
    inception?: string
    industry?: string[]
    official_site?: string
    products?: string[]
    short_description?: string
    subsidiary?: string[]
  }
  popularity: number
  tags?: Array<{
    name: string
    tag_id: string
    type: string
    value: string
  }>
}

interface SearchEntitiesDisplayProps {
  content: string
}

function parseSearchEntities(content: string): Entity[] {
  try {
    // Extract the search_entities tool result
    // Look for the pattern: tool_description end -> JSON -> endtool
    const searchEntitiesMatch = content.match(/{% tool_complete 'search_entities'[^%]*%}[\s\S]*?{% tool_description %}[^%]*{% end_tool_description %}\s*([\s\S]*?){% endtool %}/);
    if (searchEntitiesMatch && searchEntitiesMatch[1]) {
      // Clean up the JSON string - remove any leading/trailing whitespace
      const jsonString = searchEntitiesMatch[1].trim()
      const result = JSON.parse(jsonString)
      return result.entities || []
    }
  } catch (e) {
    console.warn('Failed to parse search entities:', e)
    console.log('Content being parsed:', content.substring(0, 500) + '...')
  }
  return []
}

function EntityCard({ entity }: { entity: Entity }) {
  const [expanded, setExpanded] = useState(false)

  const handleCopyEntity = async () => {
    try {
      const entityData = JSON.stringify(entity, null, 2)
      await navigator.clipboard.writeText(entityData)
    } catch (err) {
      console.error('Failed to copy entity data:', err)
    }
  }

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-3">
              {entity.properties.image?.url && (
                <img 
                  src={entity.properties.image.url} 
                  alt={entity.name}
                  className="w-12 h-12 rounded-lg object-cover shadow-sm"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  {entity.name}
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    {(entity.popularity * 100).toFixed(1)}%
                  </Badge>
                </div>
                {entity.types && entity.types.length > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    {entity.types[0].replace('urn:entity:', '').replace('_', ' ')}
                  </div>
                )}
              </div>
            </CardTitle>
            {entity.properties.short_description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {entity.properties.short_description}
              </p>
            )}
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
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 border-b pb-1">Company Details</h4>
              {entity.properties.inception && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Founded:</span>
                  <span>{new Date(entity.properties.inception).getFullYear()}</span>
                </div>
              )}
              
              {entity.properties.headquartered && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Headquarters:</span>
                  <span>{entity.properties.headquartered}</span>
                </div>
              )}
              
              {entity.properties.official_site && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Website:</span>
                  <a 
                    href={entity.properties.official_site} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {entity.properties.official_site.replace('https://', '').replace('http://', '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Industries & Products */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 border-b pb-1">Business Focus</h4>
              {entity.properties.industry && entity.properties.industry.length > 0 && (
                <div>
                  <span className="text-sm font-medium flex items-center gap-1 mb-2">
                    <Building className="w-4 h-4 text-orange-500" />
                    Industries:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {entity.properties.industry.map((industry, i) => (
                      <Badge key={i} variant="outline" className="text-xs capitalize">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {entity.properties.products && entity.properties.products.length > 0 && (
                <div>
                  <span className="text-sm font-medium flex items-center gap-1 mb-2">
                    <Tag className="w-4 h-4 text-pink-500" />
                    Products:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {entity.properties.products.map((product, i) => (
                      <Badge key={i} variant="secondary" className="text-xs capitalize">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {entity.properties.subsidiary && entity.properties.subsidiary.length > 0 && (
                <div>
                  <span className="text-sm font-medium flex items-center gap-1 mb-2">
                    <Building className="w-4 h-4 text-indigo-500" />
                    Subsidiaries:
                  </span>
                  <div className="text-xs text-gray-600">
                    {entity.properties.subsidiary.slice(0, 3).join(', ')}
                    {entity.properties.subsidiary.length > 3 && ` +${entity.properties.subsidiary.length - 3} more`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {entity.properties.external && Object.keys(entity.properties.external).length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <span className="text-sm font-medium flex items-center gap-1 mb-3">
                <Users className="w-4 h-4 text-gray-500" />
                Social Presence:
              </span>
              <div className="flex flex-wrap gap-3">
                {entity.properties.external.instagram && (
                  <a 
                    href={`https://instagram.com/${entity.properties.external.instagram.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs hover:shadow-md transition-shadow"
                  >
                    Instagram
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {entity.properties.external.twitter && (
                  <a 
                    href={`https://twitter.com/${entity.properties.external.twitter.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-xs hover:shadow-md transition-shadow"
                  >
                    Twitter
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {entity.properties.external.facebook && (
                  <a 
                    href={`https://facebook.com/${entity.properties.external.facebook.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-blue-700 text-white rounded-full text-xs hover:shadow-md transition-shadow"
                  >
                    Facebook
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {entity.tags && entity.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <span className="text-sm font-medium mb-3 block">Related Categories:</span>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {entity.tags.slice(0, 10).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
                {entity.tags.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{entity.tags.length - 10} more categories
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function SearchEntitiesDisplay({ content }: SearchEntitiesDisplayProps) {
  const entities = parseSearchEntities(content)
  
  if (entities.length === 0) {
    return null
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Entity Search Results</h3>
        <Badge variant="secondary">{entities.length} found</Badge>
      </div>
      
      {entities.map((entity, index) => (
        <EntityCard key={entity.entity_id || index} entity={entity} />
      ))}
    </div>
  )
} 