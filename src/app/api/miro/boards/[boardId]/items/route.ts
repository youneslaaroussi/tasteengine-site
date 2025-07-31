import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET - Fetch all items from a Miro board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('miro_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      )
    }

    // Fetch different types of items from the board
    const [stickyNotesRes, shapesRes, textsRes, connectorsRes] = await Promise.all([
      fetch(`https://api.miro.com/v2/boards/${boardId}/sticky_notes?limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch(`https://api.miro.com/v2/boards/${boardId}/shapes?limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch(`https://api.miro.com/v2/boards/${boardId}/texts?limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch(`https://api.miro.com/v2/boards/${boardId}/connectors?limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ])

    // Check if any requests failed
    if (!stickyNotesRes.ok || !shapesRes.ok || !textsRes.ok || !connectorsRes.ok) {
      console.error('One or more Miro API requests failed')
      throw new Error('Failed to fetch board items')
    }

    const [stickyNotes, shapes, texts, connectors] = await Promise.all([
      stickyNotesRes.json(),
      shapesRes.json(),
      textsRes.json(),
      connectorsRes.json()
    ])

    // Transform Miro API responses to our internal format
    const transformedItems = []

    // Process sticky notes
    if (stickyNotes.data) {
      for (const note of stickyNotes.data) {
        transformedItems.push({
          id: `miro-${note.id}`,
          type: 'sticky_note',
          position: { x: note.position?.x || 0, y: note.position?.y || 0 },
          content: note.data?.content || '',
          style: {
            backgroundColor: note.style?.fillColor || '#fff281',
            width: note.geometry?.width || 120,
            height: note.geometry?.height || 120
          },
          miroItemId: note.id,
          createdAt: new Date(note.createdAt).getTime(),
          updatedAt: new Date(note.modifiedAt).getTime()
        })
      }
    }

    // Process shapes
    if (shapes.data) {
      for (const shape of shapes.data) {
        transformedItems.push({
          id: `miro-${shape.id}`,
          type: 'shape',
          position: { x: shape.position?.x || 0, y: shape.position?.y || 0 },
          content: shape.data?.content || '',
          style: {
            backgroundColor: shape.style?.fillColor || '#2196F3',
            width: shape.geometry?.width || 120,
            height: shape.geometry?.height || 80
          },
          metadata: {
            shape: shape.data?.shape || 'rectangle'
          },
          miroItemId: shape.id,
          createdAt: new Date(shape.createdAt).getTime(),
          updatedAt: new Date(shape.modifiedAt).getTime()
        })
      }
    }

    // Process text items
    if (texts.data) {
      for (const text of texts.data) {
        transformedItems.push({
          id: `miro-${text.id}`,
          type: 'text',
          position: { x: text.position?.x || 0, y: text.position?.y || 0 },
          content: text.data?.content || '',
          style: {
            color: text.style?.color || '#000000',
            fontSize: text.style?.fontSize || 16
          },
          miroItemId: text.id,
          createdAt: new Date(text.createdAt).getTime(),
          updatedAt: new Date(text.modifiedAt).getTime()
        })
      }
    }

    // Process connectors
    if (connectors.data) {
      for (const connector of connectors.data) {
        transformedItems.push({
          id: `miro-${connector.id}`,
          type: 'connector',
          position: { x: 0, y: 0 }, // Connectors don't have fixed positions
          content: '',
          style: {
            color: connector.style?.color || '#000000',
            strokeWidth: connector.style?.strokeWidth || 2
          },
          metadata: {
            from: connector.startItem?.id || '',
            to: connector.endItem?.id || ''
          },
          miroItemId: connector.id,
          createdAt: new Date(connector.createdAt).getTime(),
          updatedAt: new Date(connector.modifiedAt).getTime()
        })
      }
    }

    // Sort by creation time
    transformedItems.sort((a, b) => a.createdAt - b.createdAt)

    return NextResponse.json({
      boardId,
      items: transformedItems,
      totalCount: transformedItems.length,
      counts: {
        stickyNotes: stickyNotes.data?.length || 0,
        shapes: shapes.data?.length || 0,
        texts: texts.data?.length || 0,
        connectors: connectors.data?.length || 0
      }
    })

  } catch (error) {
    console.error('Error fetching Miro board items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board items' },
      { status: 500 }
    )
  }
} 