'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { usePanelData } from '@/hooks/use-panel-data'
import { useChatStore } from '@/stores/chat-store'
import { registerPanel } from '@/lib/panel-context'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Trash2,
  RotateCcw,
  Plus,
  Minus,
  Home
} from 'lucide-react'
import { useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface MapPin {
  id: string
  lat: number
  lng: number
  title: string
  timestamp: number
}

interface MapData {
  position: {
    lat: number
    lng: number
  }
  zoom: number
  pins: MapPin[]
}

const defaultMapData: MapData = {
  position: {
    lat: 40.7128, // New York City
    lng: -74.0060
  },
  zoom: 13,
  pins: []
}

// Custom title generator for map data
const generateMapTitle = (data: MapData): string => {
  const pinCount = data.pins.length
  if (pinCount === 0) {
    return 'Map View'
  }
  return `Map with ${pinCount} pin${pinCount === 1 ? '' : 's'}`
}

// Map event handler component
function MapEventHandler({ onMapClick, onZoomChange }: { 
  onMapClick: (lat: number, lng: number) => void
  onZoomChange: (zoom: number) => void 
}) {
  const map = useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
    zoomend: () => {
      onZoomChange(map.getZoom())
    },
    moveend: () => {
      // Could also track position changes here if needed
    }
  })
  return null
}

export function MapPanel() {
  const { currentSession: chatSession } = useChatStore()
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<any>(null)
  
  const {
    data,
    save,
    clear,
    updateTitle,
  } = usePanelData<MapData>({
    storeName: 'map-panel',
    defaultData: defaultMapData,
    titleGenerator: generateMapTitle,
    sessionKey: chatSession?.id,
  })

  // Register this panel type so it can be accessed by the agent
  useEffect(() => {
    if (chatSession?.id) {
      const { storeCache } = require('@/hooks/use-panel-data')
      const effectiveStoreName = `map-panel-${chatSession.id}`
      
      registerPanel(
        'map',
        'map-panel',
        () => storeCache.get(effectiveStoreName),
        'Interactive map with pins and location data for the current chat conversation'
      )
    }
  }, [chatSession?.id])

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update map view when data changes (e.g., switching chat sessions)
  useEffect(() => {
    if (mapRef.current && data) {
      mapRef.current.setView([data.position.lat, data.position.lng], data.zoom)
    }
  }, [data.position.lat, data.position.lng, data.zoom, chatSession?.id])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newPin: MapPin = {
      id: `pin-${Date.now()}`,
      lat,
      lng,
      title: `Pin ${data.pins.length + 1}`,
      timestamp: Date.now()
    }

    const newData: MapData = {
      ...data,
      pins: [...data.pins, newPin]
    }

    save(newData)
    updateTitle()
  }, [data, save, updateTitle])

  const handleZoomChange = useCallback((zoom: number) => {
    const newData: MapData = {
      ...data,
      zoom
    }
    save(newData)
  }, [data, save])

  const handleRemovePin = useCallback((pinId: string) => {
    const newData: MapData = {
      ...data,
      pins: data.pins.filter((pin: MapPin) => pin.id !== pinId)
    }
    save(newData)
    updateTitle()
  }, [data, save, updateTitle])

  const handleClearPins = useCallback(() => {
    const newData: MapData = {
      ...data,
      pins: []
    }
    save(newData)
    updateTitle()
  }, [data, save, updateTitle])

  const handleResetView = useCallback(() => {
    clear(defaultMapData)
    if (mapRef.current) {
      mapRef.current.setView([defaultMapData.position.lat, defaultMapData.position.lng], defaultMapData.zoom)
    }
  }, [clear])

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }, [])

  const handleCenterToLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const newData: MapData = {
            ...data,
            position: { lat, lng }
          }
          save(newData)
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], data.zoom)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [data, save])

  if (!chatSession) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Start a chat to view map
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading map...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex justify-between items-center gap-2 p-2 border-b bg-gray-50">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="w-px bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCenterToLocation}
            className="h-8 w-8 p-0"
            title="My Location"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            className="h-8 w-8 p-0"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 items-center">
          <span className="text-xs text-gray-500">
            {data.pins.length} pin{data.pins.length === 1 ? '' : 's'}
          </span>
          {data.pins.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearPins} 
              className="h-8 w-8 p-0"
              title="Clear All Pins"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 min-h-0 relative">
        <MapContainer
          center={[data.position.lat, data.position.lng]}
          zoom={data.zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          key={chatSession?.id || 'default'}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapEventHandler 
            onMapClick={handleMapClick}
            onZoomChange={handleZoomChange}
          />
          
          {data.pins.map((pin: MapPin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}>
              <Popup>
                <div className="flex flex-col gap-2">
                  <div>
                    <strong>{pin.title}</strong>
                  </div>
                  <div className="text-sm text-gray-500">
                    Lat: {pin.lat.toFixed(6)}<br />
                    Lng: {pin.lng.toFixed(6)}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePin(pin.id)}
                    className="h-6 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Click instruction */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 shadow-sm">
          Click on map to add pins
        </div>
      </div>

      {/* Import Leaflet CSS */}
      <style jsx global>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
        
        .leaflet-popup-content {
          margin: 8px 12px;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
} 