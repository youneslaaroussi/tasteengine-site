'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { GA_TRACKING_ID, pageview, initGA } from '@/lib/gtag';

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (GA_TRACKING_ID) {
      pageview(pathname);
    }
  }, [pathname]);

  // Don't render anything if GA_TRACKING_ID is not set
  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Hook to use Google Analytics in components
export function useGoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (GA_TRACKING_ID) {
      pageview(pathname);
    }
  }, [pathname]);

  return {
    isEnabled: !!GA_TRACKING_ID,
    trackingId: GA_TRACKING_ID,
  };
} 