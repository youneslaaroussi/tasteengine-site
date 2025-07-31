import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST - Add text to board
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

    const response = await fetch(`https://api.miro.com/v2/boards/${boardId}/texts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          content,
        },
        style: {
          color: style?.color || '#000000',
          fontSize: style?.fontSize || 16,
          textAlign: 'center',
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
      console.error('Miro text creation failed:', errorData)
      throw new Error(`Miro API error: ${response.status}`)
    }

    const newText = await response.json()
    
    return NextResponse.json({
      id: newText.id,
      success: true
    })
  } catch (error) {
    console.error('Error creating Miro text:', error)
    return NextResponse.json(
      { error: 'Failed to create text' },
      { status: 500 }
    )
  }
} 