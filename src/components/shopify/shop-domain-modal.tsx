'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ExternalLink } from 'lucide-react'

interface ShopDomainModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (domain: string) => void
}

export function ShopDomainModal({ isOpen, onClose, onSubmit }: ShopDomainModalProps) {
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!domain.trim()) {
      setError('Please enter your shop domain')
      return
    }

    // Basic validation
    const trimmedDomain = domain.trim().toLowerCase()
    if (!trimmedDomain.includes('.') && !trimmedDomain.includes('myshopify')) {
      setError('Please enter a valid shop domain (e.g., mystore.myshopify.com)')
      return
    }

    setError('')
    onSubmit(trimmedDomain)
    setDomain('')
  }

  const handleClose = () => {
    setDomain('')
    setError('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in-0 duration-200"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-white rounded-lg border shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Connect to Shopify</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-domain">Shop Domain</Label>
              <Input
                id="shop-domain"
                type="text"
                placeholder="mystore.myshopify.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={error ? 'border-red-300 focus-visible:ring-red-500' : ''}
              />
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter your Shopify store domain. You can find this in your Shopify admin URL.
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Connect
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
} 