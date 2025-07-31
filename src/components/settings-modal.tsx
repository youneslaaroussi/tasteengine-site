'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, ExternalLink, CheckCircle, XCircle, Loader2, X, Store } from 'lucide-react'
import { useMiro } from '@/contexts/miro-context'
import { useShopify } from '@/contexts/shopify-context'
import { ShopDomainModal } from '@/components/shopify'
import { AdvancedStoreSelector } from '@/components/shopify/advanced-store-selector'

interface SettingsModalProps {
  children: React.ReactNode
}

interface Store {
  id: string
  name: string
  domain: string
  plan: string
  currency: string
}

// Mock stores data - will be replaced with real API call
const MOCK_STORES: Store[] = [
  {
    id: '1',
    name: 'Fashion Forward',
    domain: 'fashion-forward.myshopify.com',
    plan: 'Shopify Plus',
    currency: 'USD'
  },
  {
    id: '2', 
    name: 'Tech Gadgets Pro',
    domain: 'tech-gadgets-pro.myshopify.com',
    plan: 'Advanced Shopify',
    currency: 'USD'
  },
  {
    id: '3',
    name: 'Organic Kitchen',
    domain: 'organic-kitchen.myshopify.com', 
    plan: 'Basic Shopify',
    currency: 'CAD'
  }
]

function InlineStoreSelector({ onSelect, onCancel }: { onSelect: (store: Store) => void, onCancel: () => void }) {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch stores
    setIsLoading(true)
    const timer = setTimeout(() => {
      setStores(MOCK_STORES)
      setIsLoading(false)
    }, 1500) // Simulate network delay

    return () => clearTimeout(timer)
  }, [])

  const handleSelect = () => {
    if (selectedStore) {
      onSelect(selectedStore)
      setSelectedStore(null)
    }
  }

  const handleCancel = () => {
    setSelectedStore(null)
    onCancel()
  }

  if (isLoading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
        <p className="text-xs text-gray-500">Loading your stores...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        Choose which store you'd like to connect:
      </p>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {stores.map((store) => (
          <div
            key={store.id}
            className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
              selectedStore?.id === store.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedStore(store)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-900 text-xs">{store.name}</h4>
                  {selectedStore?.id === store.id && (
                    <CheckCircle className="h-3 w-3 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{store.domain}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1 py-0.5 bg-gray-100 rounded text-gray-600">
                    {store.plan}
                  </span>
                  <span className="text-xs text-gray-500">{store.currency}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-4">
          <Store className="h-6 w-6 mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-600">No stores found</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleCancel} 
          className="flex-1 h-7 text-xs"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSelect}
          disabled={!selectedStore}
          size="sm"
          className="flex-1 h-7 text-xs"
        >
          Select Store
        </Button>
      </div>
    </div>
  )
}

export function SettingsModal({ children }: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, isLoading, signIn, signOut } = useMiro()
  const { 
    isAuthenticated: shopifyIsAuthenticated, 
    user: shopifyUser, 
    isLoading: shopifyIsLoading, 
    showDomainInput,
    showStoreSelector,
    hasStores,
    activeStore,
    allStores,
    signIn: shopifySignIn, 
    signOut: shopifySignOut,
    handleDomainSubmit,
    handleStoreSelect,
    handleStoreCancel,
    closeDomainInput,
    showStoreSelection,
    refreshStores
  } = useShopify()

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in-0 duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-white rounded-lg border shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Settings</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Miro Integration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Miro</h3>
                  <p className="text-xs text-gray-500">
                    Create and manage boards
                  </p>
                </div>
                
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500">Checking...</p>
                </div>
              ) : isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-md border border-green-100">
                    <p className="text-sm text-green-800 font-medium">{user.name}</p>
                    <p className="text-xs text-green-600">{user.email}</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={signOut}
                    className="w-full h-8 text-xs"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={signIn}
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Connect
                </Button>
              )}
            </div>

            {/* Shopify Integration */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Shopify</h3>
                  <p className="text-xs text-gray-500">
                    Connect to your Shopify store
                  </p>
                </div>
                
                {shopifyIsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : shopifyIsAuthenticated ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Not connected</span>
                  </div>
                )}
              </div>

              {shopifyIsLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500">Checking...</p>
                </div>
              ) : showStoreSelector || (hasStores && !activeStore) ? (
                <AdvancedStoreSelector
                  onStoreChange={(store) => {
                    if (store) {
                      handleStoreSelect(store)
                    } else {
                      handleStoreCancel()
                    }
                  }}
                  showAddStore={true}
                  compact={true}
                />
              ) : activeStore ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-md border border-green-100">
                    <p className="text-sm text-green-800 font-medium">
                      {activeStore.shopInfo?.name || activeStore.shopDomain}
                    </p>
                    <p className="text-xs text-green-600">
                      {activeStore.shopDomain}
                    </p>
                    {activeStore.shopInfo && (
                      <>
                        <p className="text-xs text-green-600">{activeStore.shopInfo.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-green-200 rounded text-green-700">
                            {activeStore.shopInfo.plan_name}
                          </span>
                          <span className="text-xs text-green-600">
                            {activeStore.shopInfo.currency}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={showStoreSelection}
                      className="flex-1 h-8 text-xs"
                    >
                      Change Store
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={shopifySignOut}
                      className="flex-1 h-8 text-xs"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={shopifySignIn}
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Connect
                </Button>
              )}
            </div>

            {/* Future integrations placeholder */}
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 text-center">
                More integrations coming soon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shopify Modals */}
      <ShopDomainModal
        isOpen={showDomainInput}
        onClose={closeDomainInput}
        onSubmit={handleDomainSubmit}
      />
      

    </>
  )
} 