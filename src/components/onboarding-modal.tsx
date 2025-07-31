'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Node,
  Edge,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  MessageSquare, 
  Brain, 
  Zap, 
  Search, 
  TrendingUp, 
  BarChart3, 
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Image,
  Globe,
  Target
} from 'lucide-react'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MockNodeData extends Record<string, unknown> {
  type: string
  label: string
  content: string
  icon?: React.ReactNode
}

// Custom node component for the demo
function MockNode({ data }: NodeProps) {
  const nodeData = data as MockNodeData
  
  const getNodeStyle = () => {
    switch (nodeData?.type) {
      case 'user':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 text-gray-900 shadow-gray-200/50'
      case 'assistant':
        return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 text-gray-900 shadow-gray-300/50'
      case 'qloo-search':
        return 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-900 shadow-indigo-200/50'
      case 'qloo-insights':
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-900 shadow-amber-200/50'
      case 'qloo-targeting':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 text-purple-900 shadow-purple-200/50'
      case 'web-scrape':
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-900 shadow-emerald-200/50'
      case 'image-gen':
        return 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-900 shadow-red-200/50'
      case 'panel':
        return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 text-slate-900 shadow-slate-200/50'
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 text-gray-900 shadow-gray-200/50'
    }
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
      
      <div className={`px-4 py-3 rounded-xl border-2 shadow-lg ${getNodeStyle()} ${
        nodeData?.type === 'qloo-search' || nodeData?.type === 'qloo-insights' || nodeData?.type === 'qloo-targeting' 
          ? 'min-w-[320px] max-w-[380px]' 
          : nodeData?.type === 'web-scrape' || nodeData?.type === 'image-gen' || nodeData?.type === 'panel'
          ? 'min-w-[300px] max-w-[360px]'
          : nodeData?.type === 'assistant'
          ? 'min-w-[350px] max-w-[400px]'
          : 'min-w-[280px] max-w-[320px]'
      } transition-all duration-200 hover:scale-[1.02]`}>
        <div className="flex items-center gap-2 font-semibold text-sm mb-3">
          {nodeData?.icon}
          {nodeData?.label || 'Node'}
          {(nodeData?.type?.includes('qloo') || nodeData?.type === 'web-scrape' || nodeData?.type === 'image-gen') && (
            <span className="text-[10px] bg-black/10 text-black/60 px-2 py-0.5 rounded-full font-mono">
              {nodeData?.type?.includes('qloo') ? 'QLOO API' : nodeData?.type === 'web-scrape' ? 'SCRAPER' : 'AI GEN'}
            </span>
          )}
        </div>
        <div className={`leading-relaxed whitespace-pre-line ${
          nodeData?.type === 'user' || nodeData?.type === 'assistant' ? 'text-sm' : 'text-xs font-mono'
        }`}>
          {nodeData?.content}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
    </>
  )
}

const nodeTypes = {
  mock: MockNode,
}

// Mock data for the demo
const createMockNodes = (): Node[] => [
  {
    id: '1',
    type: 'mock',
    position: { x: 600, y: 50 },
    data: {
      type: 'user',
      label: 'User Message',
      content: '"Show me trending restaurants in downtown Seattle with photos and customer insights"',
      icon: <MessageSquare className="w-4 h-4" />
    }
  },
  {
    id: '2',
    type: 'mock',
    position: { x: 600, y: 350 },
    data: {
      type: 'assistant',
      label: 'AI Response',
      content: 'I\'ll analyze Seattle restaurant trends, search entities, scrape current data, generate visuals, and provide demographic insights.',
      icon: <img src="/openai.png" alt="OpenAI" className="w-6 h-6 object-contain" />
    }
  },
  {
    id: '3',
    type: 'mock',
    position: { x: 50, y: 650 },
    data: {
      type: 'qloo-search',
      label: 'Tool: search_entities',
      content: `Found 47 restaurant entities in Seattle downtown:
• Canlis - Fine dining, $$$$ 
• Pike Place Chowder - Seafood, $$
• The Pink Door - Italian, $$$
• Serious Pie - Pizza, $$
[View all entities...]`,
      icon: <img src="/qloo.png" alt="Qloo" className="w-6 h-6 object-contain" />
    }
  },
  {
    id: '4',
    type: 'mock',
    position: { x: 450, y: 650 },
    data: {
      type: 'qloo-insights',
      label: 'Tool: get_trending',
      content: `Trending restaurants this month:
🔥 +28% mention increase: Altura 
🔥 +22% mention increase: Communion
🔥 +19% mention increase: Archipelago
📊 Farm-to-table trending +15%
📊 Asian fusion popularity +12%`,
      icon: <img src="/qloo.png" alt="Qloo" className="w-6 h-6 object-contain" />
    }
  },
  {
    id: '5',
    type: 'mock',
    position: { x: 850, y: 650 },
    data: {
      type: 'web-scrape',
      label: 'Tool: scrape_url',
      content: `Scraped 8 restaurant websites:
✓ OpenTable reservations data
✓ Menu prices and seasonal items  
✓ Current reviews and ratings
✓ Social media engagement metrics
Last updated: 2 min ago`,
      icon: <img src="/scraperapi.png" alt="ScraperAPI" className="w-6 h-6 object-contain" />
    }
  },
  {
    id: '6',
    type: 'mock',
    position: { x: 1250, y: 650 },
    data: {
      type: 'image-gen',
      label: 'Tool: generate_image',
      content: `Generated visualizations:
🖼️ Seattle restaurant heatmap
🖼️ Trending cuisines infographic  
🖼️ Price comparison charts
🖼️ Customer demographic breakdown
Status: 4/4 images ready`,
      icon: <img src="/openai.png" alt="OpenAI" className="w-6 h-6 object-contain" />
    }
  },
  {
    id: '7',
    type: 'mock',
    position: { x: 300, y: 950 },
    data: {
      type: 'qloo-targeting',
      label: 'Tool: get_insights',
      content: `Audience insights for Seattle dining:
👥 Primary: 25-34 urban professionals
💰 Avg spend: $85-120 per visit
📱 Discovery: 68% via social media
🕐 Peak times: Fri-Sat 7-9pm
🎯 High affinity: craft cocktails, local sourcing`,
      icon: <img src="/qloo.png" alt="Qloo" className="w-6 h-6 object-contain" />
    }
  },
  {
    id: '8',
    type: 'mock',
    position: { x: 900, y: 950 },
    data: {
      type: 'panel',
      label: 'Panel: update_panel',
      content: `Interactive dashboard updated:
📍 Map with 47 restaurant locations
📊 Live trend charts and analytics
🖼️ Photo galleries and visual content  
👥 Demographic heat maps
🔄 Real-time data feeds active`,
      icon: <img src="/logo.png" alt="TasteEngine" className="w-6 h-6 object-contain" />
    }
  }
]

const createMockEdges = (): Edge[] => [
  // Initial flow: User -> AI
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#374151', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#374151' }
  },
  // AI orchestrates parallel tool executions
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }
  },
  {
    id: 'e2-5',
    source: '2',
    target: '5',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
  },
  {
    id: 'e2-6',
    source: '2',
    target: '6',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#ef4444', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
  },
  // Entity data and trends feed into audience insights
  {
    id: 'e3-7',
    source: '3',
    target: '7',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
  },
  {
    id: 'e4-7',
    source: '4',
    target: '7',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
  },
  // All data sources contribute to final panel
  {
    id: 'e3-8',
    source: '3',
    target: '8',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#374151', strokeWidth: 1.5 }
  },
  {
    id: 'e4-8',
    source: '4',
    target: '8',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#374151', strokeWidth: 1.5 }
  },
  {
    id: 'e5-8',
    source: '5',
    target: '8',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#374151', strokeWidth: 1.5 }
  },
  {
    id: 'e6-8',
    source: '6',
    target: '8',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#374151', strokeWidth: 1.5 }
  },
  {
    id: 'e7-8',
    source: '7',
    target: '8',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#374151', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#374151' }
  }
]

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(createMockNodes())
  const [edges, setEdges, onEdgesChange] = useEdgesState(createMockEdges())
  const [currentStep, setCurrentStep] = useState(0)

  // Auto-progress through steps
  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % 4)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isOpen])

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Assistant",
      description: "Conversational interface that understands context and provides intelligent responses for complex business queries.",
      highlight: "Intelligent"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Entity Discovery",
      description: "Advanced search capabilities to find and analyze entities, businesses, locations, and relationships across vast datasets.",
      highlight: "Comprehensive"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Insights & Analytics",
      description: "Generate actionable insights from data patterns, trends, and correlations to drive informed decision-making.",
      highlight: "Data-Driven"
    },
    {
      icon: <LayoutGrid className="w-8 h-8" />,
      title: "Visual Workflows",
      description: "Interactive panels, flow visualizations, and collaborative tools to explore and present complex information.",
      highlight: "Interactive"
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full h-full max-w-none bg-white flex overflow-hidden">
        {/* Left Side - Content */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="px-12 py-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/logo.png" 
                  alt="TasteEngine" 
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h1 className="text-3xl font-mono font-semibold text-gray-900 tracking-tight">
                    TasteEngine
                  </h1>
                  <p className="text-base text-gray-500 font-mono">Intelligent Business Analytics</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-12 py-10">
            <div className="max-w-2xl">
              {/* Main intro */}
              <div className="mb-12">
                <h2 className="text-4xl font-mono font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                  Advanced analytics
                  <br />
                  <span className="text-gray-600">made conversational</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed font-mono">
                  Transform complex data queries into natural conversations. 
                  Get intelligent insights, discover hidden patterns, and make data-driven decisions through an intuitive AI interface.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`p-8 border transition-all duration-300 ${
                      currentStep === index 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-6">
                      <div className={`p-4 transition-colors duration-300 ${
                        currentStep === index 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-mono font-semibold text-gray-900">{feature.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={`font-mono text-xs transition-colors duration-300 ${
                              currentStep === index 
                                ? 'border-gray-900 text-gray-900' 
                                : 'border-gray-300 text-gray-500'
                            }`}
                          >
                            {feature.highlight}
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed font-mono text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-12 p-8 bg-gray-900 text-white">
                <h3 className="text-xl font-mono font-semibold mb-3">Start exploring your data</h3>
                <p className="text-gray-300 mb-6 font-mono text-sm">Begin with a question and watch the analysis unfold in real-time.</p>
                <Button 
                  onClick={onClose}
                  className="bg-white text-gray-900 hover:bg-gray-100 font-mono font-medium"
                >
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - React Flow Demo */}
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-gray-100 border-l border-gray-200">
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white/50">
              <h3 className="text-lg font-bold text-gray-900 mb-1">How It Works</h3>
              <p className="text-sm text-gray-600">Watch your conversation come to life</p>
            </div>
            
            <div className="flex-1 relative">
                             <ReactFlow
                 nodes={nodes}
                 edges={edges}
                 nodeTypes={nodeTypes}
                 onNodesChange={onNodesChange}
                 onEdgesChange={onEdgesChange}
                 fitView
                 fitViewOptions={{ padding: 0.15, maxZoom: 0.7 }}
                 minZoom={0.2}
                 maxZoom={2.0}
                 nodesDraggable={true}
                 nodesConnectable={false}
                 elementsSelectable={true}
                 zoomOnScroll={true}
                 zoomOnPinch={true}
                 panOnScroll={true}
                 panOnDrag={true}
                 attributionPosition="bottom-right"
               >
                                 <Background 
                   variant={BackgroundVariant.Dots} 
                   gap={20} 
                   size={1} 
                   color="#e2e8f0" 
                 />
                 <Controls 
                   className="!bg-white/90 !border !border-gray-200 !rounded-lg"
                   showZoom={true}
                   showFitView={true}
                   showInteractive={false}
                 />
                 <MiniMap 
                   nodeColor={(node) => {
                     switch (node.data?.type) {
                       case 'user': return '#6b7280'
                       case 'assistant': return '#374151'
                       case 'qloo-search': return '#6366f1'
                       case 'qloo-insights': return '#f59e0b'
                       case 'qloo-targeting': return '#8b5cf6'
                       case 'web-scrape': return '#10b981'
                       case 'image-gen': return '#ef4444'
                       case 'panel': return '#64748b'
                       default: return '#6b7280'
                     }
                   }}
                   maskColor="rgba(0, 0, 0, 0.1)"
                   className="!bg-white/80 !border !border-gray-200 !rounded-lg"
                 />
              </ReactFlow>
              
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 