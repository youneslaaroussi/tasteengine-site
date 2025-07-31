# Miro Integration Specification

## Overview

The new Miro integration allows the AI assistant to add specific elements to Miro boards instead of just embedding iframes. This enables much more interactive and useful board collaboration.

## Frontend Data Structure

### MiroBoardElement
```typescript
interface MiroBoardElement {
  id: string
  type: 'sticky_note' | 'shape' | 'connector' | 'text' | 'image'
  position: { x: number; y: number }
  content?: string
  style?: {
    color?: string
    backgroundColor?: string
    fontSize?: number
    width?: number
    height?: number
  }
  metadata?: {
    shape?: 'rectangle' | 'circle' | 'triangle'  // for shape elements
    from?: string // for connectors (element ID)
    to?: string   // for connectors (element ID)
  }
  createdAt: number
  updatedAt: number
}
```

### MiroBoardData
```typescript
interface MiroBoardData {
  boardId: string | null
  boardUrl: string | null
  elements: MiroBoardElement[]
  lastUpdated: number
  sessionId?: string
}
```

## Required Backend APIs

### 1. Board Management

#### GET `/api/miro/boards`
- Get existing boards for user
- Response: Array of board objects

#### POST `/api/miro/boards`
- Create new board
- Body: `{ name: string, description?: string }`
- Response: `{ id: string, viewLink: string, name: string }`

### 2. Element Management APIs

#### POST `/api/miro/boards/{boardId}/sticky-notes`
- Add sticky note to board
- Body:
```json
{
  "content": "Note content",
  "position": { "x": 100, "y": 200 },
  "style": {
    "backgroundColor": "#FFEB3B",
    "color": "#000000"
  }
}
```
- Response: `{ id: string, miroItemId: string, success: boolean }`

#### POST `/api/miro/boards/{boardId}/shapes`
- Add shape to board
- Body:
```json
{
  "shape": "rectangle" | "circle" | "triangle",
  "position": { "x": 100, "y": 200 },
  "style": {
    "backgroundColor": "#2196F3",
    "width": 100,
    "height": 80
  },
  "content": "Optional text inside shape"
}
```
- Response: `{ id: string, miroItemId: string, success: boolean }`

#### POST `/api/miro/boards/{boardId}/text`
- Add text element to board
- Body:
```json
{
  "content": "Text content",
  "position": { "x": 100, "y": 200 },
  "style": {
    "fontSize": 14,
    "color": "#000000"
  }
}
```
- Response: `{ id: string, miroItemId: string, success: boolean }`

#### POST `/api/miro/boards/{boardId}/connectors`
- Add connector between elements
- Body:
```json
{
  "from": "element-id-1",
  "to": "element-id-2",
  "style": {
    "color": "#000000",
    "strokeWidth": 2
  }
}
```
- Response: `{ id: string, miroItemId: string, success: boolean }`

#### DELETE `/api/miro/boards/{boardId}/elements/{elementId}`
- Remove element from board
- Response: `{ success: boolean }`

#### GET `/api/miro/boards/{boardId}/elements`
- Get all elements on board (for sync)
- Response: `{ elements: MiroBoardElement[] }`

## Tool Interface for AI Agent

The AI agent will use a single `update_panel` tool with different actions:

### Add Sticky Note
```json
{
  "tool_name": "update_panel",
  "parameters": {
    "panelType": "miro-panel",
    "action": "add_element",
    "element": {
      "type": "sticky_note",
      "content": "Meeting notes for Q4 planning",
      "position": { "x": 150, "y": 100 },
      "style": {
        "backgroundColor": "#FFEB3B",
        "color": "#000000"
      }
    }
  }
}
```

### Add Shape
```json
{
  "tool_name": "update_panel",
  "parameters": {
    "panelType": "miro-panel",
    "action": "add_element",  
    "element": {
      "type": "shape",
      "content": "Process Step 1",
      "position": { "x": 300, "y": 200 },
      "style": {
        "backgroundColor": "#2196F3",
        "width": 120,
        "height": 80
      },
      "metadata": {
        "shape": "rectangle"
      }
    }
  }
}
```

### Add Connector
```json
{
  "tool_name": "update_panel", 
  "parameters": {
    "panelType": "miro-panel",
    "action": "add_element",
    "element": {
      "type": "connector",
      "metadata": {
        "from": "element-id-1",
        "to": "element-id-2"  
      },
      "style": {
        "color": "#000000"
      }
    }
  }
}
```

## Backend Implementation Steps

### 1. Update Tool Handler
Modify your `update_panel` tool handler to:
- Check if `panelType === "miro-panel"`
- Handle `action === "add_element"`
- Call appropriate Miro API based on `element.type`
- Return the created element data

### 2. Miro API Integration
Use the Miro Web SDK or REST API to:
- Create sticky notes: `POST /v2/boards/{board_id}/sticky_notes`
- Create shapes: `POST /v2/boards/{board_id}/shapes`
- Create text: `POST /v2/boards/{board_id}/texts`
- Create connectors: `POST /v2/boards/{board_id}/connectors`

### 3. Response Format
Always return:
```json
{
  "success": true,
  "message": "Added sticky note to board",
  "panelType": "miro-panel", 
  "action": "add_element",
  "element": {
    "id": "generated-frontend-id",
    "type": "sticky_note",
    "position": { "x": 150, "y": 100 },
    "content": "Meeting notes for Q4 planning",
    "style": { "backgroundColor": "#FFEB3B" },
    "createdAt": 1753882460000,
    "updatedAt": 1753882460000
  },
  "miroItemId": "3074457385623456789"  // ID from Miro API
}
```

## Benefits of New System

1. **Specific Control**: Agent can add exact elements instead of generic updates
2. **Visual Feedback**: Users see elements appear in real-time on frontend
3. **Interactivity**: Users can remove elements, see element counts, etc.
4. **Scalability**: Easy to add new element types (images, frames, etc.)
5. **Sync Capability**: Can sync with actual Miro board state

## Example AI Interactions

- "Add a yellow sticky note that says 'Research user needs'"
- "Create a blue rectangle for the login process"  
- "Connect the research step to the design step"
- "Add a text label that says 'Phase 1 Complete'"

This system transforms the Miro integration from a passive embed to an active collaboration tool that the AI can meaningfully contribute to. 