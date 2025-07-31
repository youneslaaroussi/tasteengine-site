import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const newStoreData = cookieStore.get('shopify_new_store')?.value
    
    if (!newStoreData) {
      return NextResponse.json({ hasNewStore: false })
    }

    try {
      const storeData = JSON.parse(newStoreData)
      
      // Clear the temporary cookie after reading
      const response = NextResponse.json({
        hasNewStore: true,
        storeData
      })
      
      response.cookies.delete('shopify_new_store')
      return response
      
    } catch (error) {
      console.error('Error parsing new store data:', error)
      
      // Clear invalid cookie
      const response = NextResponse.json({ hasNewStore: false })
      response.cookies.delete('shopify_new_store')
      return response
    }
    
  } catch (error) {
    console.error('Error checking new store data:', error)
    return NextResponse.json({ hasNewStore: false })
  }
} 