import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET - Fetch user's boards
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('miro_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const response = await fetch('https://api.miro.com/v2/boards', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Miro API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform the data to match our interface
    const transformedBoards = data.data?.map((board: any) => ({
      id: board.id,
      name: board.name,
      description: board.description || '',
      viewLink: board.viewLink,
      createdAt: board.createdAt,
      modifiedAt: board.modifiedAt,
    })) || []

    return NextResponse.json({
      data: transformedBoards,
      total: data.total || 0,
    })
  } catch (error) {
    console.error('Error fetching Miro boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

// POST - Create a new board
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('miro_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.miro.com/v2/boards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || '',
        policy: {
          permissionsPolicy: {
            collaborationToolsStartAccess: 'all_editors',
            copyAccess: 'anyone',
            sharingAccess: 'team_members_with_editing_rights'
          }
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Miro board creation failed:', errorData)
      throw new Error(`Miro API error: ${response.status}`)
    }

    const newBoard = await response.json()
    
    // Transform the response to match our interface
    const transformedBoard = {
      id: newBoard.id,
      name: newBoard.name,
      description: newBoard.description || '',
      viewLink: newBoard.viewLink,
      createdAt: newBoard.createdAt,
      modifiedAt: newBoard.modifiedAt,
    }

    return NextResponse.json(transformedBoard)
  } catch (error) {
    console.error('Error creating Miro board:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
} 