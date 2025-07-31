import { 
  Database, 
  Search, 
  ShoppingCart, 
  Image, 
  Tags,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  Globe,
  Brain,
  FileText,
  Layers,
  Zap,
  LucideIcon
} from 'lucide-react'
import { FlowNodeType } from '../flow-view'

export interface ToolConfig {
  id: string
  name: string
  category: 'memory' | 'search' | 'qloo' | 'shopify' | 'generation' | 'panel' | 'system'
  nodeType: FlowNodeType
  icon: LucideIcon
  color: string
  description: string
  expectedDuration?: number // in milliseconds
}

export interface ToolRegistryEntry extends ToolConfig {
  // Runtime tracking
  lastUsed?: number
  usageCount?: number
  averageDuration?: number
  successRate?: number
}

// Core tool registry - maps tool names to visual configurations
const TOOL_REGISTRY: Record<string, ToolConfig> = {
  // Memory Tools
  'save_to_memory': {
    id: 'save_to_memory',
    name: 'Save Memory',
    category: 'memory',
    nodeType: 'tool-memory',
    icon: Database,
    color: '#118ab2',
    description: 'Store information for future use',
    expectedDuration: 500
  },
  'retrieve_memory': {
    id: 'retrieve_memory',
    name: 'Retrieve Memory',
    category: 'memory',
    nodeType: 'tool-memory',
    icon: Database,
    color: '#118ab2',
    description: 'Access stored knowledge',
    expectedDuration: 300
  },

  // Qloo Tools
  'search_entities': {
    id: 'search_entities',
    name: 'Entity Search',
    category: 'qloo',
    nodeType: 'tool-qloo-entities',
    icon: Target,
    color: '#06d6a0',
    description: 'Find relevant entities and places',
    expectedDuration: 2000
  },
  'search_tags': {
    id: 'search_tags',
    name: 'Tag Search',
    category: 'qloo',
    nodeType: 'tool-qloo-tags',
    icon: Tags,
    color: '#48cae4',
    description: 'Discover related tags and categories',
    expectedDuration: 1500
  },
  'search_audiences': {
    id: 'search_audiences',
    name: 'Audience Analysis',
    category: 'qloo',
    nodeType: 'tool-qloo-insights',
    icon: Users,
    color: '#0077b6',
    description: 'Analyze audience preferences',
    expectedDuration: 1800
  },
  'trending_analysis': {
    id: 'trending_analysis',
    name: 'Trending Analysis',
    category: 'qloo',
    nodeType: 'tool-qloo-insights',
    icon: TrendingUp,
    color: '#f72585',
    description: 'Analyze popularity trends',
    expectedDuration: 2200
  },
  'get_insights': {
    id: 'get_insights',
    name: 'Generate Insights',
    category: 'qloo',
    nodeType: 'tool-qloo-insights',
    icon: BarChart3,
    color: '#7209b7',
    description: 'Extract meaningful insights',
    expectedDuration: 2500
  },
  'compare_entities': {
    id: 'compare_entities',
    name: 'Entity Comparison',
    category: 'qloo',
    nodeType: 'tool-qloo-insights',
    icon: BarChart3,
    color: '#7209b7',
    description: 'Compare entity similarities',
    expectedDuration: 1800
  },

  // Shopify Tools
  'search_products': {
    id: 'search_products',
    name: 'Product Search',
    category: 'shopify',
    nodeType: 'tool-shopify',
    icon: ShoppingCart,
    color: '#7209b7',
    description: 'Search Shopify products',
    expectedDuration: 1500
  },
  'get_product_details': {
    id: 'get_product_details',
    name: 'Product Details',
    category: 'shopify',
    nodeType: 'tool-shopify',
    icon: ShoppingCart,
    color: '#7209b7',
    description: 'Get detailed product information',
    expectedDuration: 800
  },
  'analyze_collections': {
    id: 'analyze_collections',
    name: 'Collection Analysis',
    category: 'shopify',
    nodeType: 'tool-shopify',
    icon: Layers,
    color: '#7209b7',
    description: 'Analyze product collections',
    expectedDuration: 2000
  },

  // Generation Tools
  'generate_image': {
    id: 'generate_image',
    name: 'Image Generation',
    category: 'generation',
    nodeType: 'tool-image-gen',
    icon: Image,
    color: '#f77f00',
    description: 'Create AI-generated images',
    expectedDuration: 8000
  },
  'generate_content': {
    id: 'generate_content',
    name: 'Content Generation',
    category: 'generation',
    nodeType: 'tool-image-gen',
    icon: FileText,
    color: '#f77f00',
    description: 'Generate text content',
    expectedDuration: 3000
  },

  // Panel Tools
  'update_panel': {
    id: 'update_panel',
    name: 'Update Panel',
    category: 'panel',
    nodeType: 'tool-panel-update',
    icon: Layers,
    color: '#6366f1',
    description: 'Update display panels',
    expectedDuration: 200
  },
  'update_map': {
    id: 'update_map',
    name: 'Update Map',
    category: 'panel',
    nodeType: 'tool-panel-update',
    icon: Globe,
    color: '#6366f1',
    description: 'Update map visualization',
    expectedDuration: 300
  },

  // System Tools
  'web_search': {
    id: 'web_search',
    name: 'Web Search',
    category: 'search',
    nodeType: 'tool-search',
    icon: Search,
    color: '#10b981',
    description: 'Search the web for information',
    expectedDuration: 2500
  },
  'api_call': {
    id: 'api_call',
    name: 'API Call',
    category: 'system',
    nodeType: 'tool-search',
    icon: Zap,
    color: '#8b5cf6',
    description: 'Make external API calls',
    expectedDuration: 1500
  }
}

export class ToolRegistry {
  private registry: Map<string, ToolRegistryEntry> = new Map()
  private usageStats: Map<string, { count: number; totalDuration: number; successes: number }> = new Map()

  constructor() {
    // Initialize registry with base configurations
    Object.values(TOOL_REGISTRY).forEach(config => {
      this.registry.set(config.id, { ...config })
    })
  }

  // Get tool configuration by name
  getToolConfig(toolName: string): ToolRegistryEntry | null {
    return this.registry.get(toolName) || null
  }

  // Get all tools in a category
  getToolsByCategory(category: ToolConfig['category']): ToolRegistryEntry[] {
    return Array.from(this.registry.values()).filter(tool => tool.category === category)
  }

  // Get all available tools
  getAllTools(): ToolRegistryEntry[] {
    return Array.from(this.registry.values())
  }

  // Register a new tool or update existing
  registerTool(config: ToolConfig): void {
    this.registry.set(config.id, { ...config })
  }

  // Record tool usage for analytics
  recordToolUsage(toolName: string, duration: number, success: boolean): void {
    const stats = this.usageStats.get(toolName) || { count: 0, totalDuration: 0, successes: 0 }
    
    stats.count++
    stats.totalDuration += duration
    if (success) stats.successes++
    
    this.usageStats.set(toolName, stats)

    // Update registry entry with computed stats
    const entry = this.registry.get(toolName)
    if (entry) {
      entry.usageCount = stats.count
      entry.averageDuration = Math.round(stats.totalDuration / stats.count)
      entry.successRate = stats.successes / stats.count
      entry.lastUsed = Date.now()
    }
  }

  // Get tool usage statistics
  getToolStats(toolName: string) {
    const entry = this.registry.get(toolName)
    const stats = this.usageStats.get(toolName)
    
    return {
      config: entry,
      usage: stats,
      performance: {
        averageDuration: entry?.averageDuration,
        successRate: entry?.successRate,
        lastUsed: entry?.lastUsed
      }
    }
  }

  // Get most used tools
  getMostUsedTools(limit: number = 10): ToolRegistryEntry[] {
    return Array.from(this.registry.values())
      .filter(tool => tool.usageCount && tool.usageCount > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit)
  }

  // Check if a tool name is recognized
  isToolRegistered(toolName: string): boolean {
    return this.registry.has(toolName)
  }

  // Get suggested tools based on context
  getSuggestedTools(context: string): ToolRegistryEntry[] {
    const contextLower = context.toLowerCase()
    
    return Array.from(this.registry.values()).filter(tool => {
      const matches = [
        tool.name.toLowerCase().includes(contextLower),
        tool.description.toLowerCase().includes(contextLower),
        tool.category === contextLower
      ]
      return matches.some(Boolean)
    })
  }
}

// Create and export singleton instance
export const toolRegistry = new ToolRegistry()

// Export the base registry for reference
export { TOOL_REGISTRY } 