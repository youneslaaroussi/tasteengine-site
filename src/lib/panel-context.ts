import { useChatStore } from '@/stores/chat-store'

// Global registry of panel types and their stores
const panelRegistry = new Map<string, {
  storeName: string
  getStore: () => any
  description: string
}>()

export function registerPanel(panelType: string, storeName: string, getStore: () => any, description: string) {
  console.log('[MIRO_DEBUG] registerPanel called:', panelType, 'with store:', storeName);
  panelRegistry.set(panelType, { storeName, getStore, description })
  console.log('[MIRO_DEBUG] Registry now has:', Array.from(panelRegistry.keys()));
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
      // Special formatting for Miro board data
      if (panelType === 'miro-panel' && data.currentData.elements) {
        const elements = data.currentData.elements
        context.push(`  Board ID: ${data.currentData.boardId || 'Not set'}`)
        context.push(`  Board URL: ${data.currentData.boardUrl || 'Not available'}`)
        context.push(`  Elements Count: ${elements.length}`)
        
        if (elements.length > 0) {
          context.push(`  Elements:`)
          elements.forEach((element: any, index: number) => {
            context.push(`    ${index + 1}. ${element.type.toUpperCase()}: "${element.content || 'No content'}" at (${element.position.x}, ${element.position.y})`)
          })
        }
      } else {
        context.push(`  Current Data: ${JSON.stringify(data.currentData, null, 2)}`)
      }
      
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
  console.log('[MIRO_DEBUG] updatePanelData called with:', { panelType, newData, chatSessionId });
  console.log('[MIRO_DEBUG] Registry size:', panelRegistry.size);
  console.log('[MIRO_DEBUG] Registry keys:', Array.from(panelRegistry.keys()));
  
  const panelInfo = panelRegistry.get(panelType)
  
  if (!panelInfo) {
    console.log('[MIRO_DEBUG] Panel not found in registry');
    return {
      success: false,
      message: `Panel type '${panelType}' not found. Available panels: ${Array.from(panelRegistry.keys()).join(', ')}`
    }
  }
  
  console.log('[MIRO_DEBUG] Panel info found:', panelInfo);
  
  try {
    console.log('[MIRO_DEBUG] Getting store...');
    const store = panelInfo.getStore()
    console.log('[MIRO_DEBUG] Store obtained:', !!store);
    
    if (!store) {
      console.log('[MIRO_DEBUG] Store is null/undefined');
      return {
        success: false,
        message: `Store not available for ${panelType} panel`
      }
    }
    
    console.log('[MIRO_DEBUG] Getting state...');
    const state = store.getState()
    console.log('[MIRO_DEBUG] State obtained:', !!state);
    console.log('[MIRO_DEBUG] State keys:', Object.keys(state || {}));
    
    if (!state) {
      console.log('[MIRO_DEBUG] State is null/undefined');
      return {
        success: false,
        message: `State not available for ${panelType} panel`
      }
    }
    
    if (typeof state.updateData !== 'function') {
      console.log('[MIRO_DEBUG] updateData is not a function, type:', typeof state.updateData);
      return {
        success: false,
        message: `updateData method not available for ${panelType} panel`
      }
    }
    
    console.log('[MIRO_DEBUG] Calling updateData with:', newData);
    // Get current data and merge with new data instead of replacing
    const currentData = state.currentSession?.data || {}
    const mergedData = { ...currentData, ...newData }
    console.log('[MIRO_DEBUG] Current data:', currentData);
    console.log('[MIRO_DEBUG] Merged data:', mergedData);
    // Update the panel data
    state.updateData(mergedData)
    console.log('[MIRO_DEBUG] updateData call completed');
    
    return {
      success: true,
      message: `Successfully updated ${panelType} panel data`
    }
  } catch (error) {
    console.error('[MIRO_DEBUG] Error in updatePanelData:', error);
    console.error('[MIRO_DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return {
      success: false,
      message: `Failed to update ${panelType} panel: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 