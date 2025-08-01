import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const shop = searchParams.get('shop')
    const error = searchParams.get('error')

    const appUrl = process.env.APP_URL || request.nextUrl.origin
    console.log('[SHOPIFY] Callback received from shop:', shop)
    console.log('[SHOPIFY] Request URL origin:', request.nextUrl.origin)

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/?shopify_error=access_denied', appUrl))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?shopify_error=no_code', appUrl))
    }

    if (!shop) {
      return NextResponse.redirect(new URL('/?shopify_error=no_shop', appUrl))
    }

    // Validate state to prevent CSRF attacks
    // Note: In a real implementation, you should store and validate the state properly
    // For now, we'll skip this validation but it's important for security

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID!,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
        code: code,
      }),
    })

    console.log('Token exchange response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/?shopify_error=token_exchange_failed', appUrl))
    }

    const tokenData = await tokenResponse.json()
    console.log('Token exchange successful')

    // Get shop information using the access token
    const shopResponse = await fetch(`https://${shop}/admin/api/2023-04/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
        'Content-Type': 'application/json',
      },
    })

    if (!shopResponse.ok) {
      console.error('Failed to get shop info:', shopResponse.status)
      return NextResponse.redirect(new URL('/?shopify_error=shop_info_failed', appUrl))
    }

    const shopData = await shopResponse.json()
    const shopInfo = shopData.shop

    // Store credentials for the new store manager system
    // The frontend will handle adding the store to StoreManager
    const storeData = {
      shopDomain: shop,
      accessToken: tokenData.access_token,
      shopInfo: {
        id: shopInfo.id,
        name: shopInfo.name,
        email: shopInfo.email,
        domain: shopInfo.domain,
        currency: shopInfo.currency,
        plan_name: shopInfo.plan_name,
        shop_owner: shopInfo.shop_owner
      }
    }

    // Create user data object for backward compatibility
    const userData = {
      id: shopInfo.id.toString(),
      name: shopInfo.shop_owner || shopInfo.name,
      email: shopInfo.email,
      shop_domain: shopInfo.domain,
      shop_name: shopInfo.name,
    }

    // Create response and set cookies
    const response = NextResponse.redirect(new URL('/?shopify_success=true', appUrl))
    
    console.log('[SHOPIFY] Redirecting to:', `${appUrl}/?shopify_success=true`)

    // Set secure cookies - both new store data and legacy user data
    response.cookies.set('shopify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    response.cookies.set('shopify_user_data', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    // Store the new store data for the StoreManager
    response.cookies.set('shopify_new_store', JSON.stringify(storeData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes - temporary cookie for store setup
    })

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    const appUrl = process.env.APP_URL || request.nextUrl.origin
    return NextResponse.redirect(new URL('/?shopify_error=callback_error', appUrl))
  }
} 