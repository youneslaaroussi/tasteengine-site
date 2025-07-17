import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
    url: "https://goflyto.com",
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
  
  // Mobile optimization
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
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
      <body className={`${inter.className} min-h-screen bg-white font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}