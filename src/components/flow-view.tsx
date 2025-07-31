'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Node,
  Edge,
  NodeProps,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  Handle,
  Position,
  Viewport
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useChatStore } from '@/stores/chat-store'
import { FlowState, SerializableNodePosition, SerializableViewport } from '@/stores/chat-store'
import { MessageSquare, Brain, Database, ShoppingCart, Zap, Copy } from 'lucide-react'
import ReactJson from 'react-json-view'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { SearchEntitiesDisplay } from './flow-view/search-entities-display'
import { ShopifyProductsDisplay } from './flow-view/shopify-products-display'
import { PanelUpdateDisplay } from './flow-view/panel-update-display'
import { GetInsightsDisplay } from './flow-view/get-insights-display'
import { ImageGenerationDisplay } from './flow-view/image-generation-display'
import { ScrapeUrlDisplay } from './flow-view/scrape-url-display'
import { GetTrendingDisplay } from './flow-view/get-trending-display'
import { AnalyzeEntitiesDisplay } from './flow-view/analyze-entities-display'

interface NodeData extends Record<string, unknown> {
  type: string
  label: string
  content: string
  fullData?: any
}

// Simple node component
function CustomNode({ data }: NodeProps) {
  const nodeData = data as NodeData
  
  const getNodeColor = () => {
    switch (nodeData?.type) {
      case 'user':
        return 'bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-200'
      case 'assistant':
        return 'bg-green-100 border-green-400 text-green-900 hover:bg-green-200'
      case 'tool':
        return 'bg-purple-100 border-purple-400 text-purple-900 hover:bg-purple-200'
      default:
        return 'bg-gray-100 border-gray-400 text-gray-900 hover:bg-gray-200'
    }
  }

  const getIcon = () => {
    // Check for specific tool types first
    if (hasSearchEntitiesContent(nodeData?.content)) {
      return <img src="/qloo.png" alt="Qloo" className="w-6 h-6 object-contain" />
    }
    if (hasGetInsightsContent(nodeData?.content) || hasGetTrendingContent(nodeData?.content) || hasAnalyzeEntitiesContent(nodeData?.content)) {
      return <img src="/qloo.png" alt="Qloo" className="w-6 h-6 object-contain" />
    }
    if (hasShopifyProductsContent(nodeData?.content)) {
      return <img src="/shopify.png" alt="Shopify" className="w-6 h-6 object-contain" />
    }
    if (hasScrapeUrlContent(nodeData?.content)) {
      return <img src="/scraperapi.png" alt="ScraperAPI" className="w-6 h-6 object-contain" />
    }
    if (hasImageGenerationContent(nodeData?.content)) {
      return <img src="/openai.png" alt="OpenAI" className="w-6 h-6 object-contain" />
    }
    if (hasPanelUpdateContent(nodeData?.content)) {
      return <img src="/logo.png" alt="TasteEngine" className="w-6 h-6 object-contain" />
    }
    
    // Default icons for general node types
    switch (nodeData?.type) {
      case 'user':
        return <MessageSquare className="w-6 h-6" />
      case 'assistant':
        return <img src="/openai.png" alt="OpenAI" className="w-6 h-6 object-contain" />
      case 'tool':
        return <Zap className="w-6 h-6" />
      default:
        return <Database className="w-6 h-6" />
    }
  }

  const handleCopyJson = async () => {
    try {
      const jsonString = JSON.stringify(nodeData.fullData || nodeData, null, 2)
      await navigator.clipboard.writeText(jsonString)
    } catch (err) {
      console.error('Failed to copy JSON:', err)
    }
  }

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 hover:bg-gray-600"
      />
      
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={`px-4 py-3 rounded-lg border-2 shadow-lg ${
              hasSearchEntitiesContent(nodeData?.content) 
                ? 'min-w-[300px] max-w-[800px] bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 text-blue-900 hover:from-blue-100 hover:to-indigo-100'
                : hasShopifyProductsContent(nodeData?.content)
                ? 'min-w-[400px] max-w-[900px] bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 text-green-900 hover:from-green-100 hover:to-emerald-100'
                : hasPanelUpdateContent(nodeData?.content)
                ? 'min-w-[300px] max-w-[600px] bg-gradient-to-br from-purple-50 to-violet-50 border-purple-300 text-purple-900 hover:from-purple-100 hover:to-violet-100'
                : hasGetInsightsContent(nodeData?.content)
                ? 'min-w-[350px] max-w-[700px] bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-900 hover:from-orange-100 hover:to-amber-100'
                : hasImageGenerationContent(nodeData?.content)
                ? 'min-w-[400px] max-w-[800px] bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 text-orange-900 hover:from-orange-100 hover:to-red-100'
                : hasScrapeUrlContent(nodeData?.content)
                ? 'min-w-[350px] max-w-[700px] bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300 text-teal-900 hover:from-teal-100 hover:to-cyan-100'
                : hasGetTrendingContent(nodeData?.content)
                ? 'min-w-[400px] max-w-[800px] bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300 text-pink-900 hover:from-pink-100 hover:to-rose-100'
                : hasAnalyzeEntitiesContent(nodeData?.content)
                ? 'min-w-[400px] max-w-[800px] bg-gradient-to-br from-violet-50 to-purple-50 border-violet-300 text-violet-900 hover:from-violet-100 hover:to-purple-100'
                : `min-w-[200px] max-w-[350px] ${getNodeColor()}`
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-2">
              {getIcon()}
              {nodeData?.label || 'Node'}
              {hasSearchEntitiesContent(nodeData?.content) && (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                  Entity Data
                </span>
              )}
              {hasShopifyProductsContent(nodeData?.content) && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                  Shopify Products
                </span>
              )}
              {hasPanelUpdateContent(nodeData?.content) && (
                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                  Panel Update
                </span>
              )}
              {hasGetInsightsContent(nodeData?.content) && (
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                  Insights
                </span>
              )}
              {hasImageGenerationContent(nodeData?.content) && (
                <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                  Image Generation
                </span>
              )}
              {hasScrapeUrlContent(nodeData?.content) && (
                <span className="text-xs bg-teal-200 text-teal-800 px-2 py-1 rounded-full">
                  URL Scrape
                </span>
              )}
              {hasGetTrendingContent(nodeData?.content) && (
                <span className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full">
                  Trending Data
                </span>
              )}
              {hasAnalyzeEntitiesContent(nodeData?.content) && (
                <span className="text-xs bg-violet-200 text-violet-800 px-2 py-1 rounded-full">
                  Entity Analysis
                </span>
              )}
            </div>
            {nodeData?.content && typeof nodeData.content === 'string' && (
              <div className="text-xs">
                                 {hasSearchEntitiesContent(nodeData.content) ? (
                   <div>
                     <SearchEntitiesDisplay content={nodeData.content} />
                   </div>
                 ) : hasShopifyProductsContent(nodeData.content) ? (
                   <div>
                     <ShopifyProductsDisplay content={nodeData.content} />
                   </div>
                 ) : hasPanelUpdateContent(nodeData.content) ? (
                   <div>
                     <PanelUpdateDisplay content={nodeData.content} />
                   </div>
                 ) : hasGetInsightsContent(nodeData.content) ? (
                   <div>
                     <GetInsightsDisplay content={nodeData.content} />
                   </div>
                 ) : hasImageGenerationContent(nodeData.content) ? (
                   <div>
                     <ImageGenerationDisplay 
                       content={nodeData.content} 
                       toolId={nodeData.toolId as string}
                     />
                   </div>
                 ) : hasScrapeUrlContent(nodeData.content) ? (
                   <div>
                     <ScrapeUrlDisplay content={nodeData.content} />
                   </div>
                 ) : hasGetTrendingContent(nodeData.content) ? (
                   <div>
                     <GetTrendingDisplay content={nodeData.content} />
                   </div>
                 ) : hasAnalyzeEntitiesContent(nodeData.content) ? (
                   <div>
                     <AnalyzeEntitiesDisplay content={nodeData.content} />
                   </div>
                 ) : (
                   <div>
                     {nodeData.content.length > 100 ? nodeData.content.substring(0, 100) + '...' : nodeData.content}
                   </div>
                 )}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleCopyJson}>
            <Copy className="w-4 h-4 mr-2" />
            Copy JSON
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 hover:bg-gray-600"
      />
    </>
  )
}

// Function to detect if content contains search_entities tool calls
function hasSearchEntitiesContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'search_entities'")
}

// Function to detect if content contains search_shopify_products tool calls
function hasShopifyProductsContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'search_shopify_products'")
}

// Function to detect if content contains update_panel tool calls
function hasPanelUpdateContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'update_panel'")
}

// Function to detect if content contains get_insights tool calls
function hasGetInsightsContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'get_insights'")
}

// Function to detect if content contains generate_image tool calls
function hasImageGenerationContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'generate_image'")
}

// Function to detect if content contains scrape_url tool calls
function hasScrapeUrlContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'scrape_url'")
}

// Function to detect if content contains get_trending tool calls
function hasGetTrendingContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'get_trending'")
}

// Function to detect if content contains analyze_entities tool calls
function hasAnalyzeEntitiesContent(content: string): boolean {
  return typeof content === 'string' && content.includes("{% tool_complete 'analyze_entities'")
}

const nodeTypes = {
  custom: CustomNode,
}

interface FlowViewProps {
  className?: string
}

export function FlowView({ className = '' }: FlowViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isFlowReady, setIsFlowReady] = useState(false)
  const { currentSession, saveFlowState, getFlowState } = useChatStore()
  
  // Helper functions to convert between React Flow types and serializable types
  const serializeNodePositions = useCallback((nodes: Node[]): SerializableNodePosition[] => {
    return nodes.map(node => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y
    }))
  }, [])
  
  const serializeViewport = useCallback((viewport: Viewport): SerializableViewport => {
    return {
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom
    }
  }, [])
  
  const applyNodePositions = useCallback((nodes: Node[], positions: SerializableNodePosition[]): Node[] => {
    return nodes.map(node => {
      const savedPosition = positions.find(pos => pos.id === node.id)
      if (savedPosition) {
        return {
          ...node,
          position: { x: savedPosition.x, y: savedPosition.y }
        }
      }
      return node
    })
  }, [])
  
  // Ref to store the debounce timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Debounced save function to avoid excessive saves
  const debouncedSave = useCallback((nodes: Node[], viewport: Viewport) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      const flowState: FlowState = {
        nodePositions: serializeNodePositions(nodes),
        viewport: serializeViewport(viewport)
      }
      saveFlowState(flowState)
      saveTimeoutRef.current = null
    }, 500) // 500ms debounce
  }, [serializeNodePositions, serializeViewport, saveFlowState])

  // Function to split message content into segments (text and tool calls)
  const splitMessageContent = useCallback((content: string) => {
    const segments: Array<{
      type: 'text' | 'tool';
      content: string;
      toolName?: string;
      toolId?: string;
    }> = []

    // Pattern to match tool calls: {% tool_complete 'toolName' 'toolId' %}...{% endtool %}
    const toolPattern = /{%\s*tool_complete\s+'([^']+)'\s+'([^']+)'\s*%}[\s\S]*?{%\s*endtool\s*%}/g
    
    let lastIndex = 0
    let match

    while ((match = toolPattern.exec(content)) !== null) {
      // Add text content before this tool call (if any)
      const textBefore = content.slice(lastIndex, match.index).trim()
      if (textBefore) {
        segments.push({
          type: 'text',
          content: textBefore
        })
      }

      // Add the tool call
      segments.push({
        type: 'tool',
        content: match[0],
        toolName: match[1],
        toolId: match[2]
      })

      lastIndex = match.index + match[0].length
    }

    // Add any remaining text content after the last tool call
    const textAfter = content.slice(lastIndex).trim()
    if (textAfter) {
      segments.push({
        type: 'text',
        content: textAfter
      })
    }

    // If no tool calls were found, treat the entire content as text
    if (segments.length === 0) {
      segments.push({
        type: 'text',
        content: content
      })
    }

    return segments
  }, [])

  useEffect(() => {
    if (!currentSession?.messages?.length) {
      setNodes([])
      setEdges([])
      setIsFlowReady(false)
      return
    }

    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    let yPos = 0
    const nodeSpacing = 150
    let nodeCounter = 0

    // Create nodes for each message, splitting complex messages
    currentSession.messages.forEach((message, messageIndex) => {
      if (message.role === 'user') {
        // User messages are always single nodes
        const nodeId = `node-${nodeCounter++}`
        
        newNodes.push({
          id: nodeId,
          type: 'custom',
          position: { x: 200, y: yPos },
          draggable: true,
          data: {
            type: 'user',
            label: 'User Message',
            content: message.content,
            fullData: message
          }
        })

        // Create edge to connect to previous node
        if (newNodes.length > 1) {
          const prevNodeId = newNodes[newNodes.length - 2].id
          newEdges.push({
            id: `edge-${prevNodeId}-${nodeId}`,
            source: prevNodeId,
            target: nodeId,
            type: 'smoothstep',
            style: {
              stroke: '#ef4444',
              strokeWidth: 3,
            },
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#ef4444',
            },
          })
        }

        yPos += nodeSpacing
      } else {
        // Assistant messages - split into segments
        const segments = splitMessageContent(message.content)
        let prevNodeId: string | null = newNodes.length > 0 ? newNodes[newNodes.length - 1].id : null

        segments.forEach((segment, segmentIndex) => {
          const nodeId = `node-${nodeCounter++}`
          
          let nodeType = 'assistant'
          let nodeLabel = 'Assistant Response'
          
          if (segment.type === 'tool') {
            nodeType = 'tool'
            nodeLabel = `Tool: ${segment.toolName}`
          }

          newNodes.push({
            id: nodeId,
            type: 'custom',
            position: { x: 200, y: yPos },
            draggable: true,
            data: {
              type: nodeType,
              label: nodeLabel,
              content: segment.content,
              toolName: segment.toolName,
              toolId: segment.toolId,
              fullData: segment.type === 'tool' ? segment : message
            }
          })

          // Create edge to connect to previous node
          if (prevNodeId) {
            newEdges.push({
              id: `edge-${prevNodeId}-${nodeId}`,
              source: prevNodeId,
              target: nodeId,
              type: 'smoothstep',
              style: {
                stroke: '#ef4444',
                strokeWidth: 3,
              },
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#ef4444',
              },
            })
          }

          prevNodeId = nodeId
          yPos += nodeSpacing
        })
      }
    })

    // Apply saved node positions if they exist
    const savedFlowState = getFlowState()
    const finalNodes = savedFlowState?.nodePositions ? 
      applyNodePositions(newNodes, savedFlowState.nodePositions) : 
      newNodes

    setNodes(finalNodes)
    setEdges(newEdges)
    setIsFlowReady(true)
  }, [currentSession?.messages, setNodes, setEdges, getFlowState, applyNodePositions])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (!currentSession?.messages?.length) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2">Flow Visualization</h3>
          <p className="text-sm">Start a conversation to see the flow</p>
        </div>
      </div>
    )
  }

  // Enhanced node change handler that saves state
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes)
    // Save state after nodes change (with debounce)
    setTimeout(() => {
      const reactFlowInstance = (window as any).reactFlowInstance
      if (reactFlowInstance && isFlowReady) {
        const viewport = reactFlowInstance.getViewport()
        const currentNodes = reactFlowInstance.getNodes()
        debouncedSave(currentNodes, viewport)
      }
    }, 100)
  }, [onNodesChange, debouncedSave, isFlowReady])

  // Viewport change handler
  const handleMove = useCallback((event: any, viewport: Viewport) => {
    if (isFlowReady) {
      const reactFlowInstance = (window as any).reactFlowInstance
      if (reactFlowInstance) {
        const currentNodes = reactFlowInstance.getNodes()
        debouncedSave(currentNodes, viewport)
      }
    }
  }, [debouncedSave, isFlowReady])

  return (
    <div className={`h-full w-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={handleMove}
        onInit={(reactFlowInstance) => {
          // Store instance globally for access in handlers
          (window as any).reactFlowInstance = reactFlowInstance
          
          // Apply saved viewport if it exists
          const savedFlowState = getFlowState()
          if (savedFlowState?.viewport && isFlowReady) {
            setTimeout(() => {
              reactFlowInstance.setViewport(savedFlowState.viewport)
            }, 100)
          } else {
            reactFlowInstance.fitView({ padding: 0.2 })
          }
        }}
        minZoom={0.5}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[20, 20]}
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const content = node.data?.content
            if (typeof content === 'string') {
              if (hasGetInsightsContent(content)) return '#f97316' // orange
              if (hasSearchEntitiesContent(content)) return '#3b82f6' // blue
              if (hasShopifyProductsContent(content)) return '#10b981' // green
              if (hasPanelUpdateContent(content)) return '#8b5cf6' // purple
              if (hasImageGenerationContent(content)) return '#dc2626' // red
              if (hasScrapeUrlContent(content)) return '#14b8a6' // teal
              if (hasGetTrendingContent(content)) return '#ec4899' // pink
              if (hasAnalyzeEntitiesContent(content)) return '#8b5cf6' // violet
            }
            
            switch (node.data?.type) {
              case 'user': return '#3b82f6'
              case 'assistant': return '#10b981'
              case 'tool': return '#8b5cf6'
              default: return '#6b7280'
            }
          }}
        />
      </ReactFlow>
    </div>
  )
} 