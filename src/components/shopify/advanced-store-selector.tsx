'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Plus, 
  RefreshCw, 
  Trash2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { storeManager } from '@/lib/store-manager'

// Import the Store type from the store manager
type StoreInfo = {
  id: string
  shopDomain: string
  accessToken: string
  addedAt: string
  isValid: boolean
  shopInfo?: {
    id: number
    name: string
    email: string
    domain: string
    currency: string
    plan_name: string
    shop_owner: string
  }
  lastValidated?: string
  error?: string
}

interface AdvancedStoreSelectorProps {
  onStoreChange?: (store: StoreInfo | null) => void
  showAddStore?: boolean
  compact?: boolean
}

export function AdvancedStoreSelector({ 
  onStoreChange, 
  showAddStore = true, 
  compact = false 
}: AdvancedStoreSelectorProps) {
  const [stores, setStores] = useState<Record<string, StoreInfo>>({})
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({})
  const [showAddForm, setShowAddForm] = useState(false)

  // Load stores on mount
  useEffect(() => {
    loadStores()
    
    // Listen for store changes
    const handleStoreChange = (event: any) => {
      loadStores()
      if (onStoreChange) {
        const store = event.detail.store
        onStoreChange(store)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storeChanged', handleStoreChange)
      return () => window.removeEventListener('storeChanged', handleStoreChange)
    }
  }, [onStoreChange])

  const loadStores = () => {
    const allStores = storeManager.getAllStores()
    const activeStore = storeManager.getActiveStore()
    
    setStores(allStores)
    setActiveStoreId(activeStore?.id || null)
  }

  const handleStoreSelect = (storeId: string) => {
    if (stores[storeId]?.isValid) {
      const success = storeManager.setActiveStore(storeId)
      if (success) {
        setActiveStoreId(storeId)
        if (onStoreChange) {
          onStoreChange(stores[storeId])
        }
      }
    }
  }

  const handleValidateStore = async (storeId: string) => {
    setIsValidating(prev => ({ ...prev, [storeId]: true }))
    
    try {
      await storeManager.validateStore(storeId)
      loadStores() // Refresh after validation
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setIsValidating(prev => ({ ...prev, [storeId]: false }))
    }
  }

  const handleRemoveStore = (storeId: string) => {
    if (window.confirm('Are you sure you want to remove this store? This action cannot be undone.')) {
      storeManager.removeStore(storeId)
      loadStores()
      
      if (onStoreChange) {
        onStoreChange(null)
      }
    }
  }

  const handleAddStore = () => {
    // Show domain input modal from parent context
    setShowAddForm(false)
    
    // Trigger OAuth flow
    const shopDomain = prompt('Enter your shop domain (e.g., mystore.myshopify.com):')
    if (shopDomain) {
      initiateOAuth(shopDomain)
    }
  }

  const initiateOAuth = (shopDomain: string) => {
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/shopify/callback`
    
    // Normalize shop domain
    const normalizedDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const finalDomain = normalizedDomain.includes('.myshopify.com') 
      ? normalizedDomain 
      : `${normalizedDomain}.myshopify.com`
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('shopify_oauth_state', state)
    
    const scopes = 'read_products,read_orders,read_customers,read_content'
    const authUrl = `https://${finalDomain}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    
    window.location.href = authUrl
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStoreStatus = (store: StoreInfo) => {
    if (!store.isValid) {
      return { icon: XCircle, color: 'text-red-500', label: 'Invalid' }
    }
    
    if (!store.lastValidated) {
      return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Unvalidated' }
    }
    
    return { icon: CheckCircle, color: 'text-green-500', label: 'Valid' }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {Object.entries(stores).map(([storeId, store]) => {
          const status = getStoreStatus(store)
          const isActive = activeStoreId === storeId
          
          return (
            <div
              key={storeId}
              className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleStoreSelect(storeId)}
            >
              <div className="flex items-center gap-2">
                <status.icon className={`h-3 w-3 ${status.color}`} />
                <div>
                  <p className="text-xs font-medium">{store.shopInfo?.name || store.shopDomain}</p>
                  <p className="text-xs text-gray-500">{store.shopDomain}</p>
                </div>
              </div>
              
              {!store.isValid && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleValidateStore(storeId)
                  }}
                  className="h-6 w-6 p-0"
                  disabled={isValidating[storeId]}
                >
                  {isValidating[storeId] ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          )
        })}
        
        {showAddStore && (
          <Button
            onClick={handleAddStore}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Store
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Your Shopify Stores</h3>
        {showAddStore && (
          <Button onClick={handleAddStore} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Store
          </Button>
        )}
      </div>

      {Object.keys(stores).length === 0 ? (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <Store className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">No stores connected yet</p>
          {showAddStore && (
            <Button onClick={handleAddStore} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Store
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(stores).map(([storeId, store]) => {
            const status = getStoreStatus(store)
            const isActive = activeStoreId === storeId
            
            return (
              <div
                key={storeId}
                className={`p-3 border rounded-lg transition-colors ${
                  isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } ${store.isValid ? 'cursor-pointer hover:border-gray-300' : ''}`}
                onClick={() => store.isValid && handleStoreSelect(storeId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <status.icon className={`h-4 w-4 ${status.color}`} />
                      <h4 className="font-medium text-sm">
                        {store.shopInfo?.name || store.shopDomain}
                      </h4>
                      {isActive && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-1">{store.shopDomain}</p>
                    
                    {store.shopInfo && (
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{store.shopInfo.plan_name}</span>
                        <span>{store.shopInfo.currency}</span>
                        {store.shopInfo.shop_owner && (
                          <span>{store.shopInfo.shop_owner}</span>
                        )}
                      </div>
                    )}
                    
                    {store.error && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {store.error}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">
                      Added {formatDate(store.addedAt)}
                      {store.lastValidated && (
                        <span> • Validated {formatDate(store.lastValidated)}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {!store.isValid && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleValidateStore(storeId)
                        }}
                        className="h-7 w-7 p-0"
                        disabled={isValidating[storeId]}
                        title="Revalidate store"
                      >
                        {isValidating[storeId] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    
                    {store.shopInfo && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://${store.shopDomain}/admin`, '_blank')
                        }}
                        className="h-7 w-7 p-0"
                        title="Open Shopify admin"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveStore(storeId)
                      }}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      title="Remove store"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 