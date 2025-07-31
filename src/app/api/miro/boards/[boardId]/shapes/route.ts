import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST - Add shape to board
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
    const { shape, content, position, style } = body

    const shapeType = shape || 'rectangle'

    const response = await fetch(`https://api.miro.com/v2/boards/${boardId}/shapes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          shape: shapeType,
          content: content || '',
        },
        style: {
          fillColor: style?.backgroundColor || '#2196F3', // Default blue
          textAlign: 'center',
          textAlignVertical: 'middle',
        },
        position: {
          x: position?.x || 0,
          y: position?.y || 0,
          origin: 'center',
        },
        geometry: {
          width: style?.width || 120,
          height: style?.height || 80,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Miro shape creation failed:', errorData)
      throw new Error(`Miro API error: ${response.status}`)
    }

    const newShape = await response.json()
    
    return NextResponse.json({
      id: newShape.id,
      success: true
    })
  } catch (error) {
    console.error('Error creating Miro shape:', error)
    return NextResponse.json(
      { error: 'Failed to create shape' },
      { status: 500 }
    )
  }
} 