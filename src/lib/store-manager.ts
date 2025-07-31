interface Store {
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

export class StoreManager {
  private stores: Record<string, Store> = {}
  private activeStore: string | null = null

  constructor() {
    this.stores = this.loadStores()
    this.activeStore = this.loadActiveStore()
  }

  // Add a new store after OAuth
  addStore(shopDomain: string, accessToken: string): Store {
    const store: Store = {
      id: this.generateStoreId(),
      shopDomain: this.normalizeShopDomain(shopDomain),
      accessToken,
      addedAt: new Date().toISOString(),
      isValid: true
    }

    this.stores[store.id] = store
    this.saveStores()

    // Validate the store credentials
    this.validateStore(store.id)

    return store
  }

  // Validate store credentials with backend
  async validateStore(storeId: string): Promise<boolean> {
    const store = this.stores[storeId]
    if (!store) return false

    try {
      const response = await fetch('/api/shopify/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopDomain: store.shopDomain,
          accessToken: store.accessToken
        })
      })

      const result = await response.json()

      if (result.success) {
        store.isValid = true
        store.shopInfo = result.shop
        store.lastValidated = new Date().toISOString()
      } else {
        store.isValid = false
        store.error = result.error
      }

      this.saveStores()
      return result.success

    } catch (error) {
      store.isValid = false
      store.error = error instanceof Error ? error.message : 'Unknown error'
      this.saveStores()
      return false
    }
  }

  // Get active store credentials
  getActiveStoreCredentials(): { shopDomain: string; accessToken: string } | null {
    if (!this.activeStore) return null

    const store = this.stores[this.activeStore]
    if (!store || !store.isValid) return null

    return {
      shopDomain: store.shopDomain,
      accessToken: store.accessToken
    }
  }

  // Get active store info
  getActiveStore(): Store | null {
    if (!this.activeStore) return null
    return this.stores[this.activeStore] || null
  }

  // Get all stores
  getAllStores(): Record<string, Store> {
    return this.stores
  }

  // Set active store
  setActiveStore(storeId: string): boolean {
    if (this.stores[storeId]) {
      this.activeStore = storeId
      localStorage.setItem('tasteengine_active_store', storeId)

      // Trigger store change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('storeChanged', {
          detail: { storeId, store: this.stores[storeId] }
        }))
      }
      
      return true
    }
    return false
  }

  // Remove a store
  removeStore(storeId: string): boolean {
    if (this.stores[storeId]) {
      // If removing active store, clear active store
      if (this.activeStore === storeId) {
        this.activeStore = null
        localStorage.removeItem('tasteengine_active_store')
      }

      delete this.stores[storeId]
      this.saveStores()

      // Trigger store change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('storeChanged', {
          detail: { storeId: null, store: null }
        }))
      }

      return true
    }
    return false
  }

  // Update store info (after revalidation)
  updateStore(storeId: string, updates: Partial<Store>): boolean {
    if (this.stores[storeId]) {
      this.stores[storeId] = { ...this.stores[storeId], ...updates }
      this.saveStores()
      return true
    }
    return false
  }

  // Check if any stores exist
  hasStores(): boolean {
    return Object.keys(this.stores).length > 0
  }

  // Get valid stores only
  getValidStores(): Record<string, Store> {
    return Object.fromEntries(
      Object.entries(this.stores).filter(([_, store]) => store.isValid)
    )
  }

  // Helper methods
  private normalizeShopDomain(domain: string): string {
    // Remove protocol and trailing slash
    const cleaned = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    // Add .myshopify.com if not present
    return cleaned.includes('.myshopify.com') ? cleaned : `${cleaned}.myshopify.com`
  }

  private generateStoreId(): string {
    return `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadStores(): Record<string, Store> {
    if (typeof window === 'undefined') return {}
    
    const stored = localStorage.getItem('tasteengine_stores')
    return stored ? JSON.parse(stored) : {}
  }

  private saveStores(): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('tasteengine_stores', JSON.stringify(this.stores))
  }

  private loadActiveStore(): string | null {
    if (typeof window === 'undefined') return null
    
    return localStorage.getItem('tasteengine_active_store')
  }

  // Revalidate all stores
  async revalidateAllStores(): Promise<void> {
    const promises = Object.keys(this.stores).map(storeId => 
      this.validateStore(storeId)
    )
    
    await Promise.all(promises)
  }

  // Get store by domain
  getStoreByDomain(shopDomain: string): Store | null {
    const normalizedDomain = this.normalizeShopDomain(shopDomain)
    return Object.values(this.stores).find(store => 
      store.shopDomain === normalizedDomain
    ) || null
  }
}

// Create singleton instance
export const storeManager = new StoreManager() 