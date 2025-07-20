# Memory System Implementation

This document describes the implementation of the `save_to_memory` tool and memory management system for the chat application.

## Overview

The memory system allows the AI assistant to save and retrieve user information, preferences, and context across chat sessions. Memories are stored locally in the browser using IndexedDB and are automatically included in chat requests to provide context to the AI.

## Architecture

### Core Components

1. **Memory Types** (`src/types/memory.ts`)
   - `Memory`: Complete memory record with metadata
   - `MemoryDto`: Data transfer object for API communication
   - `SaveToMemoryTool`: Tool call interface definition
   - `ChatRequestDto`: Extended chat request with memories

2. **Memory Storage** (`src/lib/memory-storage.ts`)
   - IndexedDB-based local storage
   - CRUD operations for memories
   - Category-based organization
   - Offline-first design

3. **Memory Service** (`src/lib/memory-service.ts`)
   - Tool call handler for `save_to_memory`
   - Memory retrieval for chat context
   - Business logic layer

4. **Chat Worker Integration** (`src/workers/chat.worker.ts`)
   - Automatic memory inclusion in chat requests
   - Tool call processing for memory operations
   - Real-time memory updates

### UI Components

1. **Memory Manager** (`src/components/memory-manager.tsx`)
   - User interface for managing memories
   - Add, edit, delete memories
   - Category-based organization

2. **Memory Hook** (`src/hooks/use-memory.ts`)
   - React hook for memory operations
   - State management and API integration

## Usage

### For AI Assistant (Tool Call)

The AI can save memories using the `save_to_memory` tool:

```json
{
  "name": "save_to_memory",
  "parameters": {
    "key": "dietary_restrictions",
    "value": "Vegetarian, allergic to nuts",
    "category": "restrictions"
  }
}
```

**Parameters:**
- `key` (required): Unique identifier for the memory
- `value` (required): The information to remember
- `category` (optional): Organization category (e.g., "preferences", "restrictions", "history")

### For Developers

#### Using the Memory Service

```typescript
import { memoryService } from '@/lib/memory-service'

// Handle a save_to_memory tool call
const result = await memoryService.handleSaveToMemoryTool(toolCall)

// Get all memories for chat context
const memories = await memoryService.getMemoriesForChat()

// Get memories by category
const preferences = await memoryService.getMemoriesByCategory('preferences')
```

#### Using the Memory Hook

```typescript
import { useMemory } from '@/hooks/use-memory'

function MyComponent() {
  const { 
    memories, 
    saveMemory, 
    deleteMemory, 
    isLoading 
  } = useMemory()

  const handleSave = async () => {
    await saveMemory({
      key: 'user_preference',
      value: 'Prefers window seats',
      category: 'travel'
    })
  }

  return (
    <div>
      {memories.map(memory => (
        <div key={memory.id}>{memory.key}: {memory.value}</div>
      ))}
    </div>
  )
}
```

#### Direct Storage Access

```typescript
import { memoryStorage } from '@/lib/memory-storage'

// Save a memory
const memory = await memoryStorage.saveMemory({
  key: 'user_name',
  value: 'John Doe',
  category: 'personal'
})

// Retrieve all memories
const allMemories = await memoryStorage.getAllMemories()
```

## Memory Categories

Common category examples:
- `preferences`: User preferences and choices
- `restrictions`: Dietary, medical, or other restrictions
- `history`: Past experiences and interactions
- `interests`: Hobbies and interests
- `personal`: Personal information
- `travel`: Travel-related preferences

## Data Flow

1. **Saving Memories:**
   ```
   AI Tool Call → Memory Service → IndexedDB Storage
   ```

2. **Chat with Memory Context:**
   ```
   User Message → Chat Worker → Load Memories → API Request (with memories)
   ```

3. **UI Management:**
   ```
   User Action → Memory Hook → Memory Storage → UI Update
   ```

## API Integration

### Request Format

Memories are automatically included in chat requests:

```typescript
{
  message: "Find me flights to Paris",
  conversationHistory: [...],
  memories: [
    {
      key: "preferred_airline",
      value: "Delta Airlines",
      category: "preferences"
    },
    {
      key: "dietary_restrictions", 
      value: "Vegetarian",
      category: "restrictions"
    }
  ]
}
```

### Backend Implementation

Your backend should:

1. Accept the `memories` field in chat requests
2. Include memories in the AI context/prompt
3. Support the `save_to_memory` tool in your AI configuration

Example tool definition for your AI:
```json
{
  "name": "save_to_memory",
  "description": "Save important information about the user for future reference",
  "parameters": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "description": "A descriptive key for the memory item"
      },
      "value": {
        "type": "string", 
        "description": "The information to save"
      },
      "category": {
        "type": "string",
        "description": "Optional category for organizing memories"
      }
    },
    "required": ["key", "value"]
  }
}
```

## Demo and Testing

Visit `/memory-demo` to see the memory system in action:
- Test memory save/retrieve operations
- Manage memories through the UI
- See example tool calls and usage

## Storage Details

- **Database**: IndexedDB (`GoFlyToMemories`)
- **Store**: `memories`
- **Indexes**: `key`, `category`, `createdAt`
- **Persistence**: Local browser storage (offline-capable)
- **Size Limits**: Follows browser IndexedDB limits

## Future Enhancements

Potential improvements:
- Memory synchronization across devices
- Memory expiration and cleanup
- Advanced search and filtering
- Memory export/import
- Memory analytics and insights
- Conflict resolution for duplicate keys

## Troubleshooting

### Common Issues

1. **IndexedDB not available**: Check browser compatibility
2. **Memory not loading**: Check browser console for errors
3. **Tool calls not working**: Verify backend AI configuration
4. **Build errors**: Ensure all types are properly imported

### Debugging

Enable memory service logging:
```typescript
// In memory-service.ts
console.log('[MEMORY_SERVICE] Operation:', operation, data)
```

Check IndexedDB in browser DevTools:
- Application → Storage → IndexedDB → GoFlyToMemories

## Contributing

When extending the memory system:
1. Follow the existing TypeScript interfaces
2. Add proper error handling
3. Include console logging for debugging
4. Update this documentation
5. Add tests for new functionality