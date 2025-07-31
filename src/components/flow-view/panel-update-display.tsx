'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  StickyNote,
  CheckCircle,
  Copy,
  Zap
} from 'lucide-react'

interface PanelElement {
  id: string
  position: {
    x: number
    y: number
  }
  content: string
  createdAt: number
  updatedAt: number
  type: string
  style?: {
    backgroundColor?: string
    color?: string
  }
}

interface PanelUpdateResult {
  success: boolean
  message: string
  panelType: string
  action: string
  boardId: string
  elements: PanelElement[]
  lastUpdated: number
}

interface PanelUpdateDisplayProps {
  content: string
}

function parsePanelUpdate(content: string): PanelUpdateResult | null {
  try {
    // Extract the update_panel tool result
    const panelMatch = content.match(/{% tool_complete 'update_panel'[^%]*%}[\s\S]*?{% tool_description %}[^%]*{% end_tool_description %}\s*([\s\S]*?){% endtool %}/);
    if (panelMatch && panelMatch[1]) {
      const jsonString = panelMatch[1].trim()
      const result = JSON.parse(jsonString)
      return result
    }
  } catch (e) {
    console.warn('Failed to parse panel update:', e)
  }
  return null
}

function getElementIcon(type: string) {
  switch (type) {
    case 'sticky_note':
      return <StickyNote className="w-4 h-4" />
    default:
      return <Zap className="w-4 h-4" />
  }
}

function getBackgroundColor(color?: string) {
  switch (color) {
    case 'light_yellow':
      return 'bg-yellow-100 border-yellow-200'
    case 'light_green':
      return 'bg-green-100 border-green-200'
    case 'light_blue':
      return 'bg-blue-100 border-blue-200'
    case 'light_pink':
      return 'bg-pink-100 border-pink-200'
    default:
      return 'bg-gray-100 border-gray-200'
  }
}

export function PanelUpdateDisplay({ content }: PanelUpdateDisplayProps) {
  const result = parsePanelUpdate(content)
  
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

  const boardUrl = `https://miro.com/app/board/${result.boardId}`

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Miro Board Updated</h3>
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

      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 font-medium">{result.message}</span>
          </div>
        </CardContent>
      </Card>

      {/* Board Link */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Board:</span>
        <a 
          href={boardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          {result.boardId}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Elements Added */}
      {result.elements && result.elements.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Elements Added:</h4>
          {result.elements.map((element, index) => (
          <Card 
            key={element.id} 
            className={`${getBackgroundColor(element.style?.backgroundColor)} border-2`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {getElementIcon(element.type)}
                <span className="capitalize">{element.type.replace('_', ' ')}</span>
                <Badge variant="outline" className="text-xs">
                  x: {element.position.x}, y: {element.position.y}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {element.content}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 pt-2 border-t">
        <div>Action: {result.action}</div>
        <div>Updated: {new Date(result.lastUpdated).toLocaleString()}</div>
      </div>
    </div>
  )
} 