'use client'

import { Node, Edge } from '@xyflow/react'
import { toolRegistry } from './tool-registry'

export interface ToolEvent {
  type: 'tool_start' | 'tool_complete' | 'tool_error'
  id: string
  toolName: string
  description?: string
  parameters?: Record<string, any>
  data?: any
  timestamp: number
  duration?: number
}

export interface ChatEvent {
  type: 'user_message' | 'agent_reasoning' | 'agent_response'
  id: string
  content: string
  timestamp: number
  reasoning?: string
  plannedActions?: string[]
}

interface FlowState {
  nodes: Node[]
  edges: Edge[]
  currentConversationId?: string
  executionPath: string[]
}

export class FlowManager {
  private state: FlowState = {
    nodes: [],
    edges: [],
    executionPath: []
  }
  
  private listeners: ((state: FlowState) => void)[] = []

  // Subscribe to flow state changes
  subscribe(listener: (state: FlowState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of state changes
  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  // Start a new conversation flow
  startConversation(conversationId: string) {
    this.state = {
      nodes: [],
      edges: [],
      currentConversationId: conversationId,
      executionPath: []
    }
    this.notify()
  }

  // Add user message node
  addUserMessage(content: string, timestamp: number = Date.now()) {
    const nodeId = `user-${timestamp}-${Math.random().toString(36).substr(2, 5)}`
    
    const node: Node = {
      id: nodeId,
      type: 'user-input',
      position: { x: 0, y: 0 }, // Will be positioned by auto-layout
      data: {
        label: 'User Query',
        message: content,
        status: 'completed',
        timestamp
      }
    }

    this.state.nodes.push(node)
    this.state.executionPath.push(nodeId)
    this.notify()
    
    return nodeId
  }

  // Add agent reasoning node
  addAgentReasoning(reasoning: string, plannedActions?: string[], timestamp: number = Date.now()) {
    const nodeId = `agent-${timestamp}-${Math.random().toString(36).substr(2, 5)}`
    const lastNodeId = this.state.executionPath[this.state.executionPath.length - 1]
    
    const node: Node = {
      id: nodeId,
      type: 'agent-reasoning',
      position: { x: 0, y: 0 }, // Will be positioned by auto-layout
      data: {
        label: 'Agent Planning',
        reasoning,
        plannedActions,
        status: 'completed',
        duration: 800
      }
    }

    this.state.nodes.push(node)
    this.state.executionPath.push(nodeId)

    // Add edge from previous node
    if (lastNodeId) {
      const edge: Edge = {
        id: `${lastNodeId}-${nodeId}`,
        source: lastNodeId,
        target: nodeId,
        animated: false,
        style: { stroke: '#64748b', strokeWidth: 2 }
      }
      this.state.edges.push(edge)
    }

    this.notify()
    return nodeId
  }

  // Add final response node
  addFinalResponse(content: string, wordCount?: number, timestamp: number = Date.now()) {
    const nodeId = `response-${timestamp}-${Math.random().toString(36).substr(2, 5)}`
    const lastNodeId = this.state.executionPath[this.state.executionPath.length - 1]
    
    const node: Node = {
      id: nodeId,
      type: 'final-response',
      position: { x: 0, y: 0 }, // Will be positioned by auto-layout
      data: {
        label: 'Final Response',
        response: content,
        wordCount,
        status: 'completed'
      }
    }

    this.state.nodes.push(node)
    this.state.executionPath.push(nodeId)

    // Connect from the last node
    if (lastNodeId) {
      const edge: Edge = {
        id: `${lastNodeId}-${nodeId}`,
        source: lastNodeId,
        target: nodeId,
        animated: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      }
      this.state.edges.push(edge)
    }

    this.notify()
    return nodeId
  }

  // Get current flow state
  getState(): FlowState {
    return { ...this.state }
  }

  // Clear the flow
  clear() {
    this.state = {
      nodes: [],
      edges: [],
      executionPath: []
    }
    
    this.notify()
  }

  // Simple auto-layout - vertical flow
  autoLayout() {
    if (this.state.nodes.length === 0) return

    let currentY = 50
    const nodeSpacing = 120
    const centerX = 250

    // Position nodes vertically in execution order
    this.state.executionPath.forEach((nodeId, index) => {
      const node = this.state.nodes.find(n => n.id === nodeId)
      if (node) {
        node.position = {
          x: centerX,
          y: currentY + (index * nodeSpacing)
        }
      }
    })

    // Position any remaining nodes that aren't in execution path
    const remainingNodes = this.state.nodes.filter(n => !this.state.executionPath.includes(n.id))
    remainingNodes.forEach((node, index) => {
      node.position = {
        x: centerX + 200,
        y: currentY + (index * nodeSpacing)
      }
    })

    this.notify()
  }
}

// Create and export singleton instance
export const flowManager = new FlowManager() 