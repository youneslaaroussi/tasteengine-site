import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST - Add sticky note to board
export async function POST(
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

    const body = await request.json()
    const { content, position, style } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.miro.com/v2/boards/${boardId}/sticky_notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          content,
          shape: 'square',
        },
        style: {
          fillColor: style?.backgroundColor || '#fff281', // Default yellow
          textAlign: 'center',
          textAlignVertical: 'middle',
        },
        position: {
          x: position?.x || 0,
          y: position?.y || 0,
          origin: 'center',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Miro sticky note creation failed:', errorData)
      throw new Error(`Miro API error: ${response.status}`)
    }

    const newStickyNote = await response.json()
    
    return NextResponse.json({
      id: newStickyNote.id,
      success: true
    })
  } catch (error) {
    console.error('Error creating Miro sticky note:', error)
    return NextResponse.json(
      { error: 'Failed to create sticky note' },
      { status: 500 }
    )
  }
} 