import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/?miro_error=access_denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?miro_error=no_code', request.url))
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.miro.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MIRO_CLIENT_ID!,
        client_secret: process.env.MIRO_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${request.nextUrl.origin}/api/miro/callback`,
      }),
    })

    console.log('Token exchange response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/?miro_error=token_exchange_failed', request.url))
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful')
    console.log('Token data received:', {
      user_id: tokenData.user_id,
      team_id: tokenData.team_id,
      scope: tokenData.scope,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type
    })

    // Use the user info from token response instead of making additional API call
    // The token response already contains user_id and team_id
    let userData
    
    if (tokenData.user_id && tokenData.team_id) {
      // We have the essential user data from the token
      userData = {
        id: tokenData.user_id,
        name: `Miro User ${tokenData.user_id}`, // Fallback name
        email: `user${tokenData.user_id}@miro.com`, // Fallback email
        team: { id: tokenData.team_id }
      }
      console.log('Using user data from token response')
    } else {
      // Fallback: try to get user info from API with user_id parameter
      console.log('Attempting to get user info from API...')
      const userResponse = await fetch(`https://api.miro.com/v2/users/${tokenData.user_id}`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('Failed to get user info:', {
          status: userResponse.status,
          statusText: userResponse.statusText,
          body: errorText
        })
        return NextResponse.redirect(new URL(`/?miro_error=user_info_failed&status=${userResponse.status}`, request.url))
      }

      userData = await userResponse.json()
    }

    // Create response and set cookies
    const response = NextResponse.redirect(new URL('/?miro_success=true', request.url))
    
    // Set secure cookies
    response.cookies.set('miro_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    response.cookies.set('miro_user_data', JSON.stringify({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      team_id: userData.team?.id || '',
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?miro_error=callback_error', request.url))
  }
} 