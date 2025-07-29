import { useChatStore } from '@/stores/chat-store'

// Global registry of panel types and their stores
const panelRegistry = new Map<string, {
  storeName: string
  getStore: () => any
  description: string
}>()

export function registerPanel(panelType: string, storeName: string, getStore: () => any, description: string) {
  panelRegistry.set(panelType, { storeName, getStore, description })
}

export function getAllPanelData(chatSessionId?: string) {
  const panelData: Record<string, any> = {}
  
  console.log('[GET_PANEL_DATA] Starting with registry size:', panelRegistry.size)
  
  for (const [panelType, { storeName, getStore, description }] of panelRegistry) {
    console.log('[GET_PANEL_DATA] Processing panel type:', panelType)
    try {
      const store = getStore()
      console.log('[GET_PANEL_DATA] Got store for', panelType, ':', !!store)
      
      if (!store) {
        console.log('[GET_PANEL_DATA] Store is null/undefined for', panelType)
        continue
      }
      
      const state = store.getState()
      console.log('[GET_PANEL_DATA] Got state for', panelType, ':', !!state)
      
      // If we have a chat session, get panel data specific to that session
      const effectiveStoreName = chatSessionId ? `${storeName}-${chatSessionId}` : storeName
      
      panelData[panelType] = {
        description,
        storeName: effectiveStoreName,
        currentData: state.currentSession?.data || null,
        hasData: !!state.currentSession?.data,
        lastUpdated: state.currentSession?.updatedAt || null,
      }
      
      console.log('[GET_PANEL_DATA] Panel data for', panelType, ':', panelData[panelType])
    } catch (error) {
      console.error(`[GET_PANEL_DATA] Error getting panel data for ${panelType}:`, error)
      panelData[panelType] = {
        description,
        error: 'Failed to load panel data'
      }
    }
  }
  
  console.log('[GET_PANEL_DATA] Final panel data:', panelData)
  return panelData
}

export function formatPanelContextForAgent(chatSessionId?: string): string {
  const panelData = getAllPanelData(chatSessionId)
  
  console.log('[PANEL_CONTEXT] Chat session ID:', chatSessionId)
  console.log('[PANEL_CONTEXT] Panel registry size:', panelRegistry.size)
  console.log('[PANEL_CONTEXT] Panel data keys:', Object.keys(panelData))
  
  if (Object.keys(panelData).length === 0) {
    console.log('[PANEL_CONTEXT] No panel data found, returning empty context')
    return ''
  }
  
  const context = [
    '\n--- PANEL CONTEXT ---',
    'Available panels and their current data:',
    ''
  ]
  
  for (const [panelType, data] of Object.entries(panelData)) {
    context.push(`${panelType.toUpperCase()}:`)
    context.push(`  Description: ${data.description}`)
    context.push(`  Has Data: ${data.hasData}`)
    
    if (data.hasData && data.currentData) {
      context.push(`  Current Data: ${JSON.stringify(data.currentData, null, 2)}`)
      if (data.lastUpdated) {
        context.push(`  Last Updated: ${new Date(data.lastUpdated).toISOString()}`)
      }
    }
    
    if (data.error) {
      context.push(`  Error: ${data.error}`)
    }
    
    context.push('')
  }
  
  context.push('You can update panel data using the update_panel tool.')
  context.push('--- END PANEL CONTEXT ---\n')
  
  return context.join('\n')
}

// Function to update panel data (called by the tool handler)
export function updatePanelData(panelType: string, newData: any, chatSessionId?: string): { success: boolean; message: string } {
  const panelInfo = panelRegistry.get(panelType)
  
  if (!panelInfo) {
    return {
      success: false,
      message: `Panel type '${panelType}' not found. Available panels: ${Array.from(panelRegistry.keys()).join(', ')}`
    }
  }
  
  try {
    const store = panelInfo.getStore()
    const state = store.getState()
    
    // Update the panel data
    state.updateData(newData)
    
    return {
      success: true,
      message: `Successfully updated ${panelType} panel data`
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to update ${panelType} panel: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 