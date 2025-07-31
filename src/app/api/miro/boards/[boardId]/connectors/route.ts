import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST - Add connector to board
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
    const { from, to, style } = body

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both from and to element IDs are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.miro.com/v2/boards/${boardId}/connectors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          shape: 'elbowed',
          mode: 'manual',
        },
        style: {
          color: style?.color || '#000000',
          strokeWidth: style?.strokeWidth || 2,
        },
        startItem: {
          id: from,
        },
        endItem: {
          id: to,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Miro connector creation failed:', errorData)
      throw new Error(`Miro API error: ${response.status}`)
    }

    const newConnector = await response.json()
    
    return NextResponse.json({
      id: newConnector.id,
      success: true
    })
  } catch (error) {
    console.error('Error creating Miro connector:', error)
    return NextResponse.json(
      { error: 'Failed to create connector' },
      { status: 500 }
    )
  }
} 