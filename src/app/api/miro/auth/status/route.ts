import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('miro_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ authenticated: false })
    }

    // Check if we have stored user data
    const userData = cookieStore.get('miro_user_data')?.value
    
    if (!userData) {
      return NextResponse.json({ authenticated: false })
    }

    try {
      const parsedUserData = JSON.parse(userData)
      return NextResponse.json({
        authenticated: true,
        user: parsedUserData
      })
    } catch (error) {
      console.error('Error parsing stored user data:', error)
      // Clear invalid cookies
      const responseWithCookie = NextResponse.json({ authenticated: false })
      responseWithCookie.cookies.delete('miro_access_token')
      responseWithCookie.cookies.delete('miro_user_data')
      return responseWithCookie
    }
  } catch (error) {
    console.error('Error checking Miro auth status:', error)
    return NextResponse.json({ authenticated: false })
  }
} 