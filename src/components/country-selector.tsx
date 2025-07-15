'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCountries } from 'use-react-countries';

interface Country {
  name: string;
  countryCallingCode: string;
  flags: {
    png: string;
    svg: string;
  };
  emoji: string;
}

// Function to detect user's country
const detectUserCountry = async (): Promise<string> => {
  try {
    const response = await fetch('/api/geoip');
    if (response.ok) {
      const data = await response.json();
      if (data.callingCode) {
        return data.callingCode;
      }
    }
  } catch (error) {
    console.error('Failed to fetch geoip data:', error);
  }

  return '+1'; // Default fallback
};

// Memoized country item component for better performance
const CountryItem = memo(({
  country,
  isSelected,
  onSelect,
  index
}: {
  country: any;
  isSelected: boolean;
  onSelect: (country: any) => void;
  index: number;
}) => (
  <Button
    key={`${country.name}-${country.countryCallingCode}-${index}`}
    variant="ghost"
    className={`w-full justify-start flex items-center gap-3 h-10 px-3 hover:bg-gray-50 rounded-sm text-left ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
      }`}
    onClick={() => onSelect(country)}
  >
    <img
      src={country.flags.svg}
      alt={`${country.name} flag`}
      className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
    />
    <div className="flex flex-col items-start flex-1 min-w-0">
      <span className="text-sm font-medium truncate w-full">
        {country.name}
      </span>
      <span className="text-xs text-gray-500">
        {country.countryCallingCode}
      </span>
    </div>
    {isSelected && (
      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
    )}
  </Button>
));

CountryItem.displayName = 'CountryItem';

interface CountrySelectorProps {
  onCountryChange?: (country: Country) => void;
  variant?: 'compact' | 'full';
}

export function CountrySelector({ onCountryChange, variant = 'compact' }: CountrySelectorProps) {
  const { countries } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreloaded, setIsPreloaded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Preload countries data to improve performance
  useEffect(() => {
    if (countries.length > 0 && !isPreloaded) {
      setIsPreloaded(true);
      // Force flag images to preload for better performance
      const flagsToPreload = countries.slice(0, 20); // Preload top 20 countries
      flagsToPreload.forEach(country => {
        const img = new Image();
        img.src = country.flags.svg;
      });
    }
  }, [countries, isPreloaded]);

  // Auto-focus search input when dropdown opens and clear search when closed
  useEffect(() => {
    if (isOpen) {
      // Use multiple attempts for better reliability
      const focusInput = () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select(); // Select any existing text
        }
      };

      // Try multiple approaches for better reliability
      setTimeout(focusInput, 0);
      setTimeout(focusInput, 10);
      setTimeout(focusInput, 50);
      setTimeout(focusInput, 100);
    } else if (!isOpen) {
      // Clear search when dropdown closes
      setSearchQuery('');
    }
  }, [isOpen]);

  // Initialize with user's country on mount
  useEffect(() => {
    if (countries.length === 0) return;

    const initializeCountry = async () => {
      const savedCountryCode = localStorage.getItem('user-country');
      const userCallingCode = savedCountryCode || await detectUserCountry();

      // Find country by matching country calling code
      const country = countries.find((c: any) =>
        c.countryCallingCode === userCallingCode
      ) || countries[0];

      setSelectedCountry(country);
      onCountryChange?.(country);
    };

    initializeCountry();
  }, [countries, onCountryChange]);

  // Handle country selection
  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    localStorage.setItem('user-country', country.countryCallingCode.replace('+', ''));
    onCountryChange?.(country);
    setIsOpen(false);
    setSearchQuery('');
  }, [onCountryChange]);

  // Smart search with relevance scoring - memoized for performance
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;

    const query = searchQuery.toLowerCase().trim();

    // Score each country based on search relevance
    const scoredCountries = countries.map((country) => {
      if (!country || !country.name) return null;

      const name = country.name.toLowerCase().trim();
      const code = country.countryCallingCode?.toLowerCase().trim() || '';
      let score = 0;

      // Exact name match (highest priority)
      if (name === query) {
        score += 1000;
      }
      // Name starts with query (very high priority)
      else if (name.startsWith(query)) {
        score += 500;
      }
      // Word in name starts with query (high priority)
      else if (name.split(/\s+/).some(word => word.startsWith(query))) {
        score += 300;
      }
      // Name contains query (medium priority)
      else if (name.includes(query)) {
        score += 100;
      }
      // Country code matches (medium priority)
      else if (code && code.includes(query)) {
        score += 50;
      }
      // No match
      else {
        return null;
      }

      // Boost shorter names (they're usually more relevant)
      if (name.length < 10) score += 10;

      // Extra boost for exact word matches
      if (name.split(/\s+/).some(word => word === query)) {
        score += 200;
      }

      return { country, score };
    }).filter((item): item is { country: any; score: number } => item !== null);

    // Sort by score (highest first) and return countries
    const sortedResults = scoredCountries
      .sort((a, b) => b.score - a.score)
      .map(item => item.country);

    // Debug: log search results for testing
    if (process.env.NODE_ENV === 'development' && query) {
      console.log(`Search for "${query}":`, sortedResults.slice(0, 5).map(c => `${c.name} (${c.countryCallingCode})`));
    }

    return sortedResults;
  }, [countries, searchQuery]);

  // Show loading state while countries are being loaded
  if (!selectedCountry || countries.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 h-8 px-2 hover:bg-gray-50 rounded-md"
        disabled
      >
        <div className="w-5 h-3 bg-gray-200 rounded-sm animate-pulse" />
        <span className="hidden sm:inline text-sm text-gray-400">Loading...</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 h-8 px-2 hover:bg-gray-50 rounded-md"
          >
            <img
              src={selectedCountry.flags.svg}
              alt={`${selectedCountry.name} flag`}
              className="w-5 h-3 object-cover"
            />
            <span className="hidden sm:inline text-sm text-gray-600">
              {selectedCountry.countryCallingCode}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 p-0"
          side="bottom"
          sideOffset={4}
        >
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Select Country</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Choose your country for personalized results
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <ScrollArea className="h-64 w-full">
            <div className="p-1">
              {filteredCountries.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country, index) => (
                  <CountryItem
                    key={`${country.name}-${country.countryCallingCode}-${index}`}
                    country={country}
                    isSelected={selectedCountry?.name === country.name && selectedCountry?.countryCallingCode === country.countryCallingCode}
                    onSelect={handleCountrySelect}
                    index={index}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full variant for use in other places
  return (
    <div className="flex items-center gap-2">
      <img
        src={selectedCountry.flags.svg}
        alt={`${selectedCountry.name} flag`}
        className="w-6 h-4 object-cover rounded-sm"
      />
      <span className="text-sm font-medium text-gray-900">{selectedCountry.name}</span>
    </div>
  );
}

// Export the selected country as a custom hook
export function useSelectedCountry() {
  const { countries } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    if (countries.length === 0) return;

    const initializeCountry = async () => {
      const savedCountryCode = localStorage.getItem('user-country');
      const defaultCountryCode = savedCountryCode || await detectUserCountry();

      console.log('useSelectedCountry - Detected country code:', defaultCountryCode);

      // Try to find country by mapping country code to name first
      const mappedCountryName = countryCodeToName[defaultCountryCode];
      console.log('useSelectedCountry - Mapped country name:', mappedCountryName);

      const country = countries.find((c: any) =>
        (mappedCountryName && c.name.toLowerCase() === mappedCountryName.toLowerCase()) ||
        c.countryCallingCode === `+${defaultCountryCode}` ||
        c.name.toLowerCase().includes(defaultCountryCode.toLowerCase()) ||
        c.countryCallingCode.replace('+', '') === defaultCountryCode ||
        c.cca2 === defaultCountryCode
      ) || countries.find((c) => c.name === 'United States') || countries[0];

      console.log('useSelectedCountry - Selected country:', country);

      setSelectedCountry(country);
    };

    initializeCountry();
  }, [countries]);

  return selectedCountry;
} 