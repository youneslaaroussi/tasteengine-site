import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Analytics } from '@/components/analytics'
import { Toaster } from 'sonner'
import { Suspense } from 'react'
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import { ChatLayoutWithHistory } from "@/components/chat-layout-with-history"
import { Eruda } from "@/components/eruda"


const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono-price',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "GoFlyTo - AI Travel Assistant",
  description: "Find the best flight deals with AI-powered search. Compare prices across multiple airlines and booking sites instantly.",
  keywords: ["flight search", "travel assistant", "AI travel", "flight deals", "travel planning", "flight booking"],
  authors: [{ name: "GoFlyTo" }],
  creator: "GoFlyTo",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gofly.to",
    siteName: "GoFlyTo",
    title: "GoFlyTo - AI Travel Assistant",
    description: "Find the best flight deals with AI-powered search. Compare prices across multiple airlines instantly.",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "GoFlyTo - AI Travel Assistant",
    description: "Find the best flight deals with AI-powered search. Compare prices across multiple airlines instantly.",
  },
  
  // PWA Configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GoFlyTo",
  },
  

  
  // Enhanced format detection for mobile
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "GoFlyTo",
    "mobile-web-app-capable": "yes",
    "theme-color": "#ffffff",
  },
  
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
  
  category: "Travel",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GoFlyTo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "GoFlyTo",
              "description": "AI-powered travel assistant for finding the best flight deals",
              "url": "https://gofly.to",
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
          'h-dvh bg-background font-sans antialiased',
          fontSans.variable,
          jetbrainsMono.variable,
        )}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const suppressPatterns = [
                  /Each child in a list should have a unique "key" prop/,
                  /Accessing element\\.ref was removed in React 19/,
                  /ref is now a regular prop/,
                  /It will be removed from the JSX Element type/,
                  /Check the render method of/,
                  /was passed a child from ChatLayoutWithHistory/
                ];
                
                const shouldSuppress = (message) => {
                  return suppressPatterns.some(pattern => pattern.test(message));
                };
                
                const originalWarn = console.warn;
                const originalError = console.error;
                
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (!shouldSuppress(message)) {
                    originalWarn.apply(console, args);
                  }
                };
                
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (!shouldSuppress(message)) {
                    originalError.apply(console, args);
                  }
                };
              })();
            `
          }}
                 />
        <Suspense>
          <Analytics />
        </Suspense>
        <Eruda />
        <Providers>
          <ChatLayoutWithHistory>
            {children}
          </ChatLayoutWithHistory>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}