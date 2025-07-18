'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  ArrowUpDown,
  DollarSign,
  Clock,
  Plane,
  Filter,
  X,
  RefreshCw,
  StopCircle,
} from 'lucide-react'
import { useFlightSearchFilters, useFlightSearchActions, useFlightSearchState } from '@/contexts/flight-search-provider'
import { useIsMobile } from '@/hooks/use-mobile'
import { SortOption, FilterOptions } from '@/stores/flight-search-store'
import { cn } from '@/lib/utils'

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'default', label: 'Default', icon: <ArrowUpDown size={16} /> },
  { value: 'cheapest', label: 'Cheapest', icon: <DollarSign size={16} /> },
  { value: 'fastest', label: 'Fastest', icon: <Clock size={16} /> },
  { value: 'shortest', label: 'Fewest Stops', icon: <Plane size={16} /> },
]

interface FlightSearchControlsProps {
  className?: string
}

export function FlightSearchControls({ className }: FlightSearchControlsProps) {
  const isMobile = useIsMobile()
  const { sortBy, filters, setSortBy, setFilters } = useFlightSearchFilters()
  const { cancelSearch, refreshSearch, resetSearch } = useFlightSearchActions()
  const { isSearching, isLoading, isFetching } = useFlightSearchState()
  
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)

  const hasActiveFilters = Object.keys(filters).length > 0

  const handleSortChange = (newSortBy: SortOption) => {
    setSortBy(newSortBy)
  }

  const handleApplyFilters = () => {
    setFilters(localFilters)
    setIsFilterDialogOpen(false)
  }

  const handleClearFilters = () => {
    const emptyFilters: FilterOptions = {}
    setLocalFilters(emptyFilters)
    setFilters(emptyFilters)
    setIsFilterDialogOpen(false)
  }

  const handleStop = async () => {
    await cancelSearch()
  }

  const handleRefresh = () => {
    refreshSearch()
  }

  const handleReset = () => {
    resetSearch()
  }

  if (isMobile) {
    return (
      <div className={cn('flex flex-col space-y-3', className)}>
        {/* Mobile Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {isSearching && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="flex items-center gap-2"
              >
                <StopCircle size={16} />
                Stop
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={!isSearching && !isFetching}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={cn(isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-red-600 hover:text-red-700"
          >
            Reset
          </Button>
        </div>

        {/* Mobile Sort and Filter Row */}
        <div className="flex space-x-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start">
                {sortOptions.find(option => option.value === sortBy)?.icon}
                <span className="ml-2">
                  {sortOptions.find(option => option.value === sortBy)?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={cn(
                    'flex items-center space-x-2',
                    sortBy === option.value && 'bg-accent'
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Dialog */}
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant={hasActiveFilters ? "default" : "outline"} 
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                Filters
                {hasActiveFilters && (
                  <span className="bg-white text-black rounded-full px-1.5 py-0.5 text-xs">
                    {Object.keys(filters).length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Flight Filters</DialogTitle>
              </DialogHeader>
              <FlightFiltersForm 
                filters={localFilters} 
                onChange={setLocalFilters}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className={cn('flex items-center justify-between p-4 bg-gray-50 rounded-lg', className)}>
      <div className="flex items-center space-x-4">
        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex space-x-1">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange(option.value)}
                className="flex items-center gap-2"
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Filter Button */}
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-black rounded-full px-1.5 py-0.5 text-xs">
                  {Object.keys(filters).length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Flight Filters</DialogTitle>
            </DialogHeader>
            <FlightFiltersForm 
              filters={localFilters} 
              onChange={setLocalFilters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {isSearching && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
          >
            <StopCircle size={16} />
            Stop Search
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={!isSearching && !isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={cn(isFetching && 'animate-spin')} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-red-600 hover:text-red-700"
        >
          Reset Search
        </Button>
      </div>
    </div>
  )
}

interface FlightFiltersFormProps {
  filters: FilterOptions
  onChange: (filters: FilterOptions) => void
  onApply: () => void
  onClear: () => void
}

function FlightFiltersForm({ filters, onChange, onApply, onClear }: FlightFiltersFormProps) {
  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Max Price */}
      <div className="space-y-2">
        <Label htmlFor="maxPrice">Maximum Price</Label>
        <div className="space-y-2">
          <Slider
            id="maxPrice"
            min={0}
            max={5000}
            step={50}
            value={[filters.maxPrice || 5000]}
            onValueChange={([value]) => updateFilter('maxPrice', value)}
            className="w-full"
          />
          <div className="text-sm text-gray-600">
            Up to ${filters.maxPrice || 5000}
          </div>
        </div>
      </div>

      {/* Max Stops */}
      <div className="space-y-2">
        <Label htmlFor="maxStops">Maximum Stops</Label>
        <div className="space-y-2">
          <Slider
            id="maxStops"
            min={0}
            max={3}
            step={1}
            value={[filters.maxStops ?? 3]}
            onValueChange={([value]) => updateFilter('maxStops', value)}
            className="w-full"
          />
          <div className="text-sm text-gray-600">
            Up to {filters.maxStops ?? 3} stop{(filters.maxStops ?? 3) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Duration Range */}
      <div className="space-y-2">
        <Label>Flight Duration (hours)</Label>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="minDuration" className="text-xs">Min</Label>
              <Slider
                id="minDuration"
                min={0}
                max={24}
                step={1}
                value={[Math.floor((filters.minDuration || 0) / 60)]}
                onValueChange={([value]) => updateFilter('minDuration', value * 60)}
                className="w-full"
              />
              <div className="text-xs text-gray-600">
                {Math.floor((filters.minDuration || 0) / 60)}h
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="maxDuration" className="text-xs">Max</Label>
              <Slider
                id="maxDuration"
                min={1}
                max={48}
                step={1}
                value={[Math.floor((filters.maxDuration || 48 * 60) / 60)]}
                onValueChange={([value]) => updateFilter('maxDuration', value * 60)}
                className="w-full"
              />
              <div className="text-xs text-gray-600">
                {Math.floor((filters.maxDuration || 48 * 60) / 60)}h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between space-x-2">
        <Button variant="outline" onClick={onClear}>
          Clear All
        </Button>
        <Button onClick={onApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  )
}