'use client';

import { useEffect } from 'react';
import { useCountries } from 'use-react-countries';

// Preloader component to initialize countries data early
export function CountryPreloader() {
  const { countries } = useCountries();

  useEffect(() => {
    if (countries.length > 0) {
      // Preload flag images for popular countries
      const popularCountries = countries.filter(country => 
        ['United States', 'Canada', 'United Kingdom', 'France', 'Germany', 
         'Italy', 'Spain', 'Australia', 'Japan', 'China', 'India', 'Brazil'].includes(country.name)
      );
      
      popularCountries.forEach(country => {
        const img = new Image();
        img.src = country.flags.svg;
      });
    }
  }, [countries]);

  return null; // This component doesn't render anything
} 