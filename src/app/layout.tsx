import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@fontsource/jetbrains-mono";
import { GoogleAnalytics } from "@/components/google-analytics";
import { ExternalScript } from "@/components/external-script";
import { FlightSearchProvider } from '@/contexts/flight-search-context';
import { SavedFlightsProvider } from '@/contexts/saved-flights-context';
import { cn } from "@/lib/utils";
import { CountryPreloader } from "@/components/country-preloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoFlyTo - Your AI-Powered Travel Assistant",
  description: "Find the best flight deals with AI-powered search. Compare prices across multiple airlines and booking sites instantly. Plan your perfect trip with intelligent recommendations.",
  keywords: [
    "flight search", "travel assistant", "AI travel", "flight deals", 
    "travel planning", "flight booking", "airline comparison", "travel AI",
    "cheap flights", "flight finder", "travel planner"
  ],
  authors: [{ name: "GoFlyTo Team" }],
  creator: "GoFlyTo",
  publisher: "GoFlyTo",
  
  // Open Graph tags for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://goflyto.com",
    siteName: "GoFlyTo",
    title: "GoFlyTo - Your AI-Powered Travel Assistant",
    description: "Find the best flight deals with AI-powered search. Compare prices across multiple airlines and booking sites instantly.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GoFlyTo - AI-Powered Travel Assistant",
      },
      {
        url: "/og-image-square.png",
        width: 1080,
        height: 1080,
        alt: "GoFlyTo - AI-Powered Travel Assistant",
      },
    ],
  },
  
  // Twitter Card tags
  twitter: {
    card: "summary_large_image",
    site: "@goflyto",
    creator: "@goflyto",
    title: "GoFlyTo - Your AI-Powered Travel Assistant",
    description: "Find the best flight deals with AI-powered search. Compare prices across multiple airlines and booking sites instantly.",
    images: ["/twitter-image.png"],
  },
  
  // iOS-specific enhancements
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GoFlyTo",
    startupImage: [
      {
        url: "/apple-touch-startup-image-750x1334.png",
        media: "screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/apple-touch-startup-image-1242x2208.png", 
        media: "screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/apple-touch-startup-image-1125x2436.png",
        media: "screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/apple-touch-startup-image-1536x2048.png",
        media: "screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  
  // Enhanced icons for better iOS integration
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-touch-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-touch-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-touch-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-touch-icon-57x57.png", sizes: "57x57", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#2563eb",
      },
    ],
  },
  
  manifest: "/site.webmanifest",
  
  // Enhanced format detection for iOS
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  
  // iOS and social media specific meta tags
  other: {
    "msapplication-TileColor": "#2563eb",
    "theme-color": "#ffffff",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "GoFlyTo",
    "mobile-web-app-capable": "yes",
    "application-name": "GoFlyTo",
    "msapplication-TileImage": "/mstile-144x144.png",
    "msapplication-config": "/browserconfig.xml",
    "apple-touch-fullscreen": "yes",
    "apple-mobile-web-app-capable": "yes",
    "facebook-domain-verification": "your_facebook_verification_code",
    "google-site-verification": "your_google_verification_code",
    "referrer": "strict-origin-when-cross-origin",
  },
  
  // Enhanced robots for better SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Enhanced viewport for iOS
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  
  // Category for app stores
  category: "Travel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* iOS-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GoFlyTo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* Enhanced iOS touch handling */}
        <meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        {/* Social media verification */}
        <meta name="facebook-domain-verification" content="your_facebook_verification_code" />
        <meta name="google-site-verification" content="your_google_verification_code" />
        
        {/* iOS Safari enhancements */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Preload critical resources for better iOS performance */}
        <link rel="preload" href="/apple-touch-icon.png" as="image" />
        
        {/* iOS-specific DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Enhanced structured data for social media */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "GoFlyTo",
              "description": "AI-powered travel assistant for finding the best flight deals",
              "url": "https://goflyto.com",
              "applicationCategory": "Travel",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "category": "Travel Services",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "AI-powered flight search",
                "Multi-airline comparison",
                "Real-time price tracking",
                "Intelligent travel recommendations"
              ]
            })
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          "touch-manipulation", // Better touch handling on iOS
          "select-none", // Prevent text selection on iOS for better app feel
          geistSans.variable
        )}
      >
        <CountryPreloader />
        <SavedFlightsProvider>
          <FlightSearchProvider>
            {children}
          </FlightSearchProvider>
        </SavedFlightsProvider>
        <GoogleAnalytics />
        <ExternalScript />
      </body>
    </html>
  );
}
