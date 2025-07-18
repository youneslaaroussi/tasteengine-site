'use client'

import React from 'react'
import { useFlightSearchState, useFlightSearchData } from '@/contexts/flight-search-provider'
import { useFlightSearchStore } from '@/stores/flight-search-store'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlightSearchStatusProps {
  className?: string
  showDetailedStats?: boolean
}

export function FlightSearchStatus({ 
  className, 
  showDetailedStats = false 
}: FlightSearchStatusProps) {
  const isMobile = useIsMobile()
  const { searchId, isSearching, isLoading, isFetching, error, retryAttempts } = useFlightSearchState()
  const { flights, displayedFlights, hasMoreResults } = useFlightSearchData()
  const { searchStatus, lastUpdate } = useFlightSearchStore()

  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusInfo = () => {
    if (error) {
      return {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        status: 'Error',
        message: error,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      }
    }

    if (isSearching) {
      return {
        icon: <Search className="w-5 h-5 text-blue-500 animate-pulse" />,
        status: 'Searching',
        message: searchStatus ? 
          `Checking ${searchStatus.progress.gatesCompleted}/${searchStatus.progress.gatesQueried} sources` :
          'Finding the best deals...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      }
    }

    if (flights.length > 0) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        status: 'Complete',
        message: `Found ${flights.length} flight${flights.length !== 1 ? 's' : ''}`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      }
    }

    if (searchId) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        status: 'No Results',
        message: 'No flights found for your search',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      }
    }

    return {
      icon: <Clock className="w-5 h-5 text-gray-500" />,
      status: 'Ready',
      message: 'Start your search to find flights',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    }
  }

  const statusInfo = getStatusInfo()

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return null
    
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const getProgressPercentage = () => {
    if (!searchStatus?.progress) return 0
    return searchStatus.progress.percentComplete || 0
  }

  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Main Status */}
        <div className={cn(
          'flex items-center space-x-3 p-3 rounded-lg border',
          statusInfo.bgColor,
          statusInfo.borderColor
        )}>
          {statusInfo.icon}
          <div className="flex-1 min-w-0">
            <div className={cn('font-medium text-sm', statusInfo.color)}>
              {statusInfo.status}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {statusInfo.message}
            </div>
          </div>
          {!isOnline && (
            <WifiOff className="w-4 h-4 text-orange-500 flex-shrink-0" />
          )}
        </div>

        {/* Progress Bar */}
        {isSearching && searchStatus?.progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Search Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {showDetailedStats && flights.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-gray-900">{flights.length}</div>
              <div className="text-gray-500">Total Found</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-gray-900">{displayedFlights.length}</div>
              <div className="text-gray-500">Displayed</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Status Bar */}
      <div className={cn(
        'flex items-center justify-between p-4 rounded-lg border',
        statusInfo.bgColor,
        statusInfo.borderColor
      )}>
        <div className="flex items-center space-x-3">
          {statusInfo.icon}
          <div>
            <div className={cn('font-medium', statusInfo.color)}>
              {statusInfo.status}
            </div>
            <div className="text-sm text-gray-600">
              {statusInfo.message}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-500" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Last Update */}
          {lastUpdate > 0 && (
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4" />
              <span>Updated {formatLastUpdate(lastUpdate)}</span>
            </div>
          )}

          {/* Retry Attempts */}
          {retryAttempts > 0 && (
            <div className="flex items-center space-x-1 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{retryAttempts} retries</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isSearching && searchStatus?.progress && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Searching {searchStatus.progress.gatesCompleted} of {searchStatus.progress.gatesQueried} sources
            </span>
            <span>{Math.round(getProgressPercentage())}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Detailed Statistics */}
      {showDetailedStats && flights.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{flights.length}</div>
                <div className="text-sm text-gray-500">Total Found</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{displayedFlights.length}</div>
                <div className="text-sm text-gray-500">After Filters</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {searchStatus?.totalFlights || 0}
                </div>
                <div className="text-sm text-gray-500">Total Available</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {hasMoreResults ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-gray-500">More Results</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}