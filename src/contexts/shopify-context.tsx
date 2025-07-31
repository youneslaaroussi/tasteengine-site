'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { storeManager } from '@/lib/store-manager'

interface ShopifyStore {
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

interface ShopifyUser {
  id: string
  name: string
  email: string
  shop_domain: string
  shop_name: string
  selectedStore?: ShopifyStore
}

interface ShopifyContextType {
  isAuthenticated: boolean
  user: ShopifyUser | null
  isLoading: boolean
  showDomainInput: boolean
  showStoreSelector: boolean
  hasStores: boolean
  activeStore: ShopifyStore | null
  allStores: Record<string, ShopifyStore>
  signIn: () => void
  signOut: () => void
  checkAuthStatus: () => Promise<void>
  handleDomainSubmit: (domain: string) => void
  handleStoreSelect: (store: ShopifyStore) => void
  handleStoreCancel: () => void
  closeDomainInput: () => void
  showStoreSelection: () => void
  refreshStores: () => void
}

const ShopifyContext = createContext<ShopifyContextType | null>(null)

interface ShopifyProviderProps {
  children: ReactNode
}

export function ShopifyProvider({ children }: ShopifyProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<ShopifyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDomainInput, setShowDomainInput] = useState(false)
  const [showStoreSelector, setShowStoreSelector] = useState(false)
  const [hasStores, setHasStores] = useState(false)
  const [activeStore, setActiveStore] = useState<ShopifyStore | null>(null)
  const [allStores, setAllStores] = useState<Record<string, ShopifyStore>>({})

  const refreshStores = () => {
    const stores = storeManager.getAllStores()
    const activeStoreData = storeManager.getActiveStore()
    
    setAllStores(stores)
    setActiveStore(activeStoreData)
    setHasStores(storeManager.hasStores())
  }

  const checkAuthStatus = async () => {
    try {
      // Check for legacy authentication first
      const response = await fetch('/api/shopify/auth/status')
      const data = await response.json()
      
      if (data.authenticated) {
        setIsAuthenticated(true)
        setUser(data.user)
      }

      // Check for new store data after OAuth
      const newStoreResponse = await fetch('/api/shopify/new-store')
      const newStoreData = await newStoreResponse.json()
      
      if (newStoreData.hasNewStore) {
        // Add the new store to the manager
        const store = storeManager.addStore(
          newStoreData.storeData.shopDomain,
          newStoreData.storeData.accessToken
        )
        
        // Set it as active
        storeManager.setActiveStore(store.id)
        
        // Update store info if available
        if (newStoreData.storeData.shopInfo) {
          storeManager.updateStore(store.id, {
            shopInfo: newStoreData.storeData.shopInfo,
            isValid: true,
            lastValidated: new Date().toISOString()
          })
        }
        
        setIsAuthenticated(true)
      }

      // Refresh stores from StoreManager
      refreshStores()

      // Check if we need to show store selector
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('shopify_success') === 'true') {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Don't show selector if we just added a store
        if (!newStoreData.hasNewStore && !storeManager.hasStores()) {
          setShowStoreSelector(true)
        }
      } else if (!storeManager.hasStores() && !data.authenticated) {
        // No stores and no legacy auth
        setIsAuthenticated(false)
        setUser(null)
      } else if (!storeManager.getActiveStore() && storeManager.hasStores()) {
        // Has stores but no active store selected
        setShowStoreSelector(true)
      }

    } catch (error) {
      console.error('Error checking Shopify auth status:', error)
      setIsAuthenticated(false)
      setUser(null)
      refreshStores()
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = () => {
    setShowDomainInput(true)
  }

  const handleDomainSubmit = (domain: string) => {
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/shopify/callback`
    
    // Normalize shop domain
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const finalDomain = normalizedDomain.includes('.myshopify.com') 
      ? normalizedDomain 
      : `${normalizedDomain}.myshopify.com`
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('shopify_oauth_state', state)
    
    const scopes = 'read_products,read_orders,read_customers,read_content'
    const authUrl = `https://${finalDomain}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    
    setShowDomainInput(false)
    window.location.href = authUrl
  }

  const handleStoreSelect = (store: ShopifyStore) => {
    // Use StoreManager to set active store
    const success = storeManager.setActiveStore(store.id)
    if (success) {
      setActiveStore(store)
      setShowStoreSelector(false)
      setIsAuthenticated(true)
      
      // Update user with selected store for backward compatibility
      if (user) {
        const updatedUser = { ...user, selectedStore: store }
        setUser(updatedUser)
      }
    }
  }

  const handleStoreCancel = () => {
    // User cancelled store selection, sign them out
    signOut()
    setShowStoreSelector(false)
  }

  const closeDomainInput = () => {
    setShowDomainInput(false)
  }

  const showStoreSelection = () => {
    setShowStoreSelector(true)
  }

  const signOut = async () => {
    try {
      await fetch('/api/shopify/auth/signout', { method: 'POST' })
      
      // Clear all stores from StoreManager
      const stores = storeManager.getAllStores()
      Object.keys(stores).forEach(storeId => {
        storeManager.removeStore(storeId)
      })
      
      setIsAuthenticated(false)
      setUser(null)
      setActiveStore(null)
      setAllStores({})
      setHasStores(false)
      setShowStoreSelector(false)
      setShowDomainInput(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    checkAuthStatus()
    
    // Listen for store changes from StoreManager
    const handleStoreChange = (event: any) => {
      refreshStores()
      if (event.detail.store) {
        setIsAuthenticated(true)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storeChanged', handleStoreChange)
      return () => window.removeEventListener('storeChanged', handleStoreChange)
    }
  }, [])

  const value: ShopifyContextType = {
    isAuthenticated,
    user,
    isLoading,
    showDomainInput,
    showStoreSelector,
    signIn,
    signOut,
    checkAuthStatus,
    handleDomainSubmit,
    handleStoreSelect,
    handleStoreCancel,
    closeDomainInput,
    showStoreSelection,
    hasStores,
    activeStore,
    allStores,
    refreshStores,
  }

  return (
    <ShopifyContext.Provider value={value}>
      {children}
    </ShopifyContext.Provider>
  )
}

export function useShopify() {
  const context = useContext(ShopifyContext)
  if (!context) {
    throw new Error('useShopify must be used within a ShopifyProvider')
  }
  return context
} 