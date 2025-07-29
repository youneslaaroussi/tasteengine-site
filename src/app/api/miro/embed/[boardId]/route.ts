import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET - Get embed HTML for a specific board using oEmbed
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

    // First, get the board details to get the viewLink
    const boardResponse = await fetch(`https://api.miro.com/v2/boards/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!boardResponse.ok) {
      console.error('Failed to get board details:', await boardResponse.text())
      return NextResponse.json(
        { error: 'Failed to get board details' },
        { status: boardResponse.status }
      )
    }

    const boardData = await boardResponse.json()
    
    // Create Live Embed URL for EDITABLE access with all Miro tools
    const liveEmbedUrl = `https://miro.com/app/live-embed/${boardId}/`
    
    // Create iframe HTML for editable embed
    const embedHtml = `<iframe 
      class="miro-embedded-board" 
      src="${liveEmbedUrl}" 
      referrerpolicy="no-referrer-when-downgrade" 
      allowfullscreen 
      allow="fullscreen; clipboard-read; clipboard-write" 
      style="width: 100%; height: 100%; border: 1px solid #ccc; border-radius: 8px;"
    ></iframe>`
    
    console.log('Created editable Live Embed URL:', liveEmbedUrl)

    return NextResponse.json({
      boardId,
      boardUrl: boardData.viewLink,
      liveEmbedUrl,
      html: embedHtml,
      width: '100%',
      height: '100%',
      title: boardData.name,
      type: 'live-embed-editable'
    })
  } catch (error) {
    console.error('Error getting embed data:', error)
    return NextResponse.json(
      { error: 'Failed to get embed data' },
      { status: 500 }
    )
  }
} 