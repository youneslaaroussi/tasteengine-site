'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  ShoppingCart, 
  Package,
  DollarSign,
  Tag,
  Store,
  Calendar,
  Copy,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react'

interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  vendor: string
  productType: string
  tags: string[]
  status: string
  totalInventory: number
  featuredImage?: {
    id: string
    url: string
    altText: string
    width: number
    height: number
  }
  priceRange: {
    minVariantPrice: {
      amount: string
      currencyCode: string
    }
    maxVariantPrice: {
      amount: string
      currencyCode: string
    }
  }
  firstVariant: {
    id: string
    price: string
    compareAtPrice?: string
    availableForSale: boolean
    inventoryQuantity: number
  }
  collections: Array<{
    id: string
    title: string
    handle: string
  }>
  createdAt: string
  updatedAt: string
}

interface ShopifyProductsResult {
  success: boolean
  searchQuery: string
  totalFound: number
  hasMore: boolean
  products: ShopifyProduct[]
  filters: {
    query: string
    status: string
    sortKey: string
    reverse: boolean
  }
  pageInfo: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor: string
    endCursor: string
  }
}

interface ShopifyProductsDisplayProps {
  content: string
}

function parseShopifyProducts(content: string): ShopifyProductsResult | null {
  try {
    // Extract the search_shopify_products tool result
    const shopifyMatch = content.match(/{% tool_complete 'search_shopify_products'[^%]*%}[\s\S]*?{% tool_description %}[^%]*{% end_tool_description %}\s*([\s\S]*?){% endtool %}/);
    if (shopifyMatch && shopifyMatch[1]) {
      const jsonString = shopifyMatch[1].trim()
      const result = JSON.parse(jsonString)
      return result
    }
  } catch (e) {
    console.warn('Failed to parse shopify products:', e)
  }
  return null
}

function formatPrice(amount: string, currencyCode: string): string {
  const price = parseFloat(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(price)
}

function getInventoryStatus(product: ShopifyProduct) {
  if (!product.firstVariant.availableForSale) {
    return { status: 'unavailable', label: 'Unavailable', color: 'bg-red-500' }
  }
  if (product.totalInventory === 0) {
    return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-orange-500' }
  }
  if (product.totalInventory < 10) {
    return { status: 'low-stock', label: 'Low Stock', color: 'bg-yellow-500' }
  }
  return { status: 'in-stock', label: 'In Stock', color: 'bg-green-500' }
}

function ProductCard({ product }: { product: ShopifyProduct }) {
  const [expanded, setExpanded] = useState(false)
  const inventoryStatus = getInventoryStatus(product)
  
  const handleCopyProduct = async () => {
    try {
      const productData = JSON.stringify(product, null, 2)
      await navigator.clipboard.writeText(productData)
    } catch (err) {
      console.error('Failed to copy product data:', err)
    }
  }

  const isPriceRange = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount

  return (
    <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative">
        {product.featuredImage ? (
          <div className="aspect-square overflow-hidden bg-gray-100">
            <img 
              src={product.featuredImage.url} 
              alt={product.featuredImage.altText || product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            className={`${inventoryStatus.color} text-white text-xs px-2 py-1`}
          >
            {inventoryStatus.label}
          </Badge>
        </div>

        {/* Copy Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyProduct}
          className="absolute top-3 left-3 bg-white/80 hover:bg-white text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {product.title}
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-green-600">
              {isPriceRange ? (
                <span>
                  {formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                  {' - '}
                  {formatPrice(product.priceRange.maxVariantPrice.amount, product.priceRange.maxVariantPrice.currencyCode)}
                </span>
              ) : (
                formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Store className="w-4 h-4" />
            <span>{product.vendor}</span>
            {product.productType && (
              <>
                <span>•</span>
                <span className="capitalize">{product.productType}</span>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-4">
            {/* Inventory Details */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Package className="w-4 h-4 text-blue-500" />
                Inventory
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Stock:</span>
                  <div className="font-medium">{product.totalInventory} units</div>
                </div>
                <div>
                  <span className="text-gray-500">Variant Stock:</span>
                  <div className="font-medium">{product.firstVariant.inventoryQuantity} units</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4 text-purple-500" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Collections */}
            {product.collections.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4 text-green-500" />
                  Collections
                </h4>
                <div className="space-y-1">
                  {product.collections.map((collection, i) => (
                    <div key={i} className="text-sm text-blue-600 capitalize">
                      {collection.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                Dates
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <div className="font-medium">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Handle */}
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">
                Handle: <code className="bg-gray-100 px-1 rounded">{product.handle}</code>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function ShopifyProductsDisplay({ content }: ShopifyProductsDisplayProps) {
  const result = parseShopifyProducts(content)
  
  if (!result || !result.success) {
    return null
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold">Shopify Products</h3>
          <Badge variant="secondary" className="text-sm">
            {result.totalFound} found
          </Badge>
          {result.hasMore && (
            <Badge variant="outline" className="text-sm">
              <Eye className="w-3 h-3 mr-1" />
              Showing {result.products.length}
            </Badge>
          )}
        </div>
        
        {/* Search Info */}
        <div className="text-sm text-gray-500 flex items-center gap-2">
          {result.filters.status && (
            <Badge variant="outline" className="text-xs">
              Status: {result.filters.status}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            Sort: {result.filters.sortKey}
          </Badge>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {result.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination Info */}
      {(result.pageInfo.hasNextPage || result.pageInfo.hasPreviousPage) && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {result.pageInfo.hasPreviousPage && (
              <Badge variant="outline" className="text-xs">
                ← Previous Available
              </Badge>
            )}
            {result.pageInfo.hasNextPage && (
              <Badge variant="outline" className="text-xs">
                Next Available →
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 