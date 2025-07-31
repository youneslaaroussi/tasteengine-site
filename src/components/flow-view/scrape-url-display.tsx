import React from 'react'
import { Globe, CheckCircle, XCircle, Database, Clock } from 'lucide-react'

interface ScrapeUrlDisplayProps {
  content: string
}

interface ScrapedElement {
  selector: string
  content: string
  type: string
}

interface ScrapeMetadata {
  total_elements: number
  text_elements: number
  image_elements: number
  scraped_at: string
  processing_time_ms: number
}

interface VectorMetadata {
  chunks_generated: number
  vectors_stored: boolean
  vector_db_available: boolean
}

interface ScrapeUrlData {
  url: string
  success: boolean
  elements: ScrapedElement[]
  metadata: ScrapeMetadata
  vector_metadata: VectorMetadata
}

export function ScrapeUrlDisplay({ content }: ScrapeUrlDisplayProps) {
  // Extract JSON from tool content
  const extractJsonFromContent = (content: string) => {
    try {
      // Find the JSON part after tool_description and before endtool
      const jsonMatch = content.match(/{% tool_description %}.*?{% end_tool_description %}\s*\n([\s\S]*?)\n{% endtool %}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // Fallback: try to find JSON between any closing tag and endtool
      const fallbackMatch = content.match(/}\s*\n(\{[\s\S]*?\})\s*\n{% endtool %}/);
      if (fallbackMatch) {
        return JSON.parse(fallbackMatch[1].trim());
      }
      
      // Another fallback: look for JSON object after the description
      const simpleMatch = content.match(/\n(\{[\s\S]*?\})\s*\n{% endtool %}/);
      if (simpleMatch) {
        return JSON.parse(simpleMatch[1].trim());
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing scrape_url JSON:', error);
      console.log('Content:', content);
      return null;
    }
  }

  const data: ScrapeUrlData | null = extractJsonFromContent(content)

  if (!data) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="w-4 h-4" />
          <span className="font-medium">Error parsing scrape data</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with URL and Status */}
      <div className="flex items-start gap-2">
        <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{data.url}</span>
            {data.success ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-gray-600">
            Status: {data.success ? 'Success' : 'Failed'}
          </div>
        </div>
      </div>

      {/* Metadata Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-50 p-2 rounded border">
          <div className="font-medium text-blue-800">Elements</div>
          <div className="text-blue-600">
            {data.metadata.total_elements} total
            <br />
            {data.metadata.text_elements} text, {data.metadata.image_elements} images
          </div>
        </div>
        <div className="bg-purple-50 p-2 rounded border">
          <div className="font-medium text-purple-800">Vectors</div>
          <div className="text-purple-600">
            {data.vector_metadata.chunks_generated} chunks
            <br />
            {data.vector_metadata.vectors_stored ? 'Stored' : 'Not stored'}
          </div>
        </div>
      </div>

      {/* Processing Time */}
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        <span>Processed in {data.metadata.processing_time_ms}ms</span>
      </div>

      {/* Sample Elements */}
      {data.elements && data.elements.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Sample Elements:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.elements.slice(0, 5).map((element, index) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                <div className="font-mono text-gray-500 text-[10px] mb-1">
                  {element.selector}
                </div>
                <div className="text-gray-700 line-clamp-2">
                  {element.content.length > 100 
                    ? element.content.substring(0, 100) + '...' 
                    : element.content}
                </div>
              </div>
            ))}
            {data.elements.length > 5 && (
              <div className="text-xs text-gray-500 text-center py-1">
                ... and {data.elements.length - 5} more elements
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 