import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { shopDomain, accessToken } = await request.json()

    if (!shopDomain || !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing shopDomain or accessToken'
      }, { status: 400 })
    }

    // Validate the access token by making a request to Shopify's shop endpoint
    const shopResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!shopResponse.ok) {
      let errorMessage = 'Invalid credentials'
      
      if (shopResponse.status === 401) {
        errorMessage = 'Access token is invalid or expired'
      } else if (shopResponse.status === 403) {
        errorMessage = 'Access token does not have required permissions'
      } else if (shopResponse.status === 404) {
        errorMessage = 'Shop not found - check domain spelling'
      } else if (shopResponse.status === 429) {
        errorMessage = 'Rate limit exceeded - please try again later'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        statusCode: shopResponse.status
      }, { status: 200 }) // Return 200 but with success: false
    }

    const shopData = await shopResponse.json()
    const shop = shopData.shop

    // Return formatted shop information
    return NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        name: shop.name,
        email: shop.email,
        domain: shop.domain,
        currency: shop.currency,
        plan_name: shop.plan_name,
        shop_owner: shop.shop_owner,
        country_name: shop.country_name,
        province: shop.province,
        city: shop.city,
        address1: shop.address1,
        phone: shop.phone,
        created_at: shop.created_at,
        updated_at: shop.updated_at,
        timezone: shop.timezone,
        money_format: shop.money_format,
        money_with_currency_format: shop.money_with_currency_format,
        weight_unit: shop.weight_unit,
        myshopify_domain: shop.myshopify_domain,
        plan_display_name: shop.plan_display_name,
        password_enabled: shop.password_enabled,
        has_storefront: shop.has_storefront,
        eligible_for_card_reader_giveaway: shop.eligible_for_card_reader_giveaway,
        eligible_for_payments: shop.eligible_for_payments,
        requires_extra_payments_agreement: shop.requires_extra_payments_agreement,
        pre_launch_enabled: shop.pre_launch_enabled,
        checkout_api_supported: shop.checkout_api_supported,
        multi_location_enabled: shop.multi_location_enabled,
        setup_required: shop.setup_required,
        enabled_presentment_currencies: shop.enabled_presentment_currencies
      }
    })

  } catch (error) {
    console.error('Store validation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    }, { status: 500 })
  }
} 