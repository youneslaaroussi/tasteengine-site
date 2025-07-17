'use client'

import { memo } from 'react'
import { Plane, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolResultProps {
  toolName: string
  content: string
  isComplete?: boolean
}

// Tool result extraction and rendering
export function extractToolResult(content: string) {
  const toolStartRegex = /{% (\w+)_start "([^"]*)" %}/g
  const toolCompleteRegex = /{% (\w+)_complete "([^"]*)" %}\n\n([\s\S]*?)(?=\n\n|\n?{% |$)/g
  
  const results = []
  let match
  
  // Extract tool starts
  while ((match = toolStartRegex.exec(content)) !== null) {
    results.push({
      type: 'tool_start',
      toolName: match[1],
      description: match[2],
    })
  }
  
  // Extract tool completions with data
  while ((match = toolCompleteRegex.exec(content)) !== null) {
    const toolName = match[1]
    const description = match[2]
    const data = match[3]
    
    let parsedData = null
    try {
      // Try to parse JSON data
      if (data && data.trim().startsWith('{')) {
        parsedData = JSON.parse(data.trim())
      }
    } catch (e) {
      // If not JSON, keep as string
      parsedData = data
    }
    
    results.push({
      type: 'tool_complete',
      toolName,
      description,
      data: parsedData,
    })
  }
  
  return results
}

export const ToolProgress = memo(({ toolName, content, isComplete }: ToolResultProps) => {
  const getToolIcon = (tool: string) => {
    if (tool.includes('flight') || tool.includes('search')) {
      return <Plane className="w-4 h-4" />
    }
    return <Clock className="w-4 h-4" />
  }

  const getToolDisplayName = (tool: string) => {
    const toolNames: Record<string, string> = {
      'initiate_flight_search': 'Searching for flights',
      'search_bookable_flights': 'Finding bookable flights',
      'create_flight_itinerary': 'Creating itinerary',
      'validate_booking': 'Validating booking',
      'create_booking': 'Creating booking',
      'create_affiliate_links': 'Generating booking links',
    }
    return toolNames[tool] || tool.replace(/_/g, ' ')
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      isComplete 
        ? "bg-green-50 border-green-200 text-green-800" 
        : "bg-blue-50 border-blue-200 text-blue-800"
    )}>
      <div className="flex-shrink-0">
        {isComplete ? (
          getToolIcon(toolName)
        ) : (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {getToolDisplayName(toolName)}
        </div>
        {content && (
          <div className="text-xs opacity-75 truncate">
            {content}
          </div>
        )}
      </div>
    </div>
  )
})

ToolProgress.displayName = 'ToolProgress'

export const FlightResults = memo(({ data }: { data: any }) => {
  if (!data || !data.flights || !Array.isArray(data.flights)) {
    return null
  }

  return (
    <div className="space-y-3 mt-4">
      <h4 className="font-medium text-gray-900">Flight Options</h4>
      {data.flights.slice(0, 3).map((flight: any, index: number) => (
        <div key={index} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium">
                {flight.origin} → {flight.destination}
              </div>
              <div className="text-sm text-gray-600">
                {flight.airline} {flight.flightNumber}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">
                {flight.currency}{flight.price}
              </div>
              <div className="text-sm text-gray-600">
                {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{flight.departureTime}</span>
            <span>{flight.duration}</span>
            <span>{flight.arrivalTime}</span>
          </div>
        </div>
      ))}
      {data.flights.length > 3 && (
        <div className="text-sm text-gray-600 text-center">
          And {data.flights.length - 3} more flights...
        </div>
      )}
    </div>
  )
})

FlightResults.displayName = 'FlightResults'

export function renderToolResult(result: any) {
  const { type, toolName, description, data } = result
  
  if (type === 'tool_start') {
    return <ToolProgress toolName={toolName} content={description} isComplete={false} />
  }
  
  if (type === 'tool_complete') {
    const flightTools = ['search_bookable_flights', 'create_flight_itinerary', 'initiate_flight_search']
    
    if (flightTools.includes(toolName) && data && data.flights) {
      return (
        <div>
          <ToolProgress toolName={toolName} content={description} isComplete={true} />
          <FlightResults data={data} />
        </div>
      )
    }
    
    return <ToolProgress toolName={toolName} content={description} isComplete={true} />
  }
  
  return null
}