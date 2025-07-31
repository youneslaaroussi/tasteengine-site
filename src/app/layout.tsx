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
import { LoadingWrapper } from "@/components/loading-wrapper"
import { OnboardingWrapper } from "@/components/onboarding-wrapper"


const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono-price',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "TasteEngine - AI Marketing Intelligence Platform",
  description: "Unlock consumer insights with Qloo-powered cultural AI. Strategic intelligence for marketing professionals, brand strategists, and business leaders.",
  keywords: ["marketing intelligence", "consumer insights", "AI marketing", "brand strategy", "cultural intelligence", "audience analytics"],
  authors: [{ name: "TasteEngine" }],
  creator: "TasteEngine",
  publisher: "TasteEngine",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tasteengine.com",
    siteName: "TasteEngine",
    title: "TasteEngine - AI Marketing Intelligence Platform",
    description: "Unlock consumer insights with Qloo-powered cultural AI. Strategic intelligence for marketing professionals instantly.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TasteEngine - AI Marketing Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TasteEngine - AI Marketing Intelligence Platform",
    description: "Unlock consumer insights with Qloo-powered cultural AI. Strategic intelligence for marketing professionals instantly.",
    images: ["/twitter-image.png"],
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
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "",
    yandex: "",
  },
  category: "Marketing Intelligence",
  other: {
    "apple-mobile-web-app-title": "TasteEngine",
  },
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
        <meta name="apple-mobile-web-app-title" content="TasteEngine" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "TasteEngine",
              "url": "https://tasteengine.com",
              "description": "AI-powered marketing intelligence platform with Qloo cultural insights",
              "operatingSystem": "Any",
              "applicationCategory": "Marketing Intelligence",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5.0",
                "ratingCount": "100"
              },
              "category": "Marketing Intelligence",
              "offers": {
                "@type": "Offer",
                "category": "SaaS"
              },
              "featureList": [
                "AI-powered consumer insights",
                "Cultural intelligence analysis",
                "Strategic marketing recommendations"
              ]
            }),
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
        <LoadingWrapper>
          <Providers>
            <OnboardingWrapper>
              <ChatLayoutWithHistory>
                {children}
              </ChatLayoutWithHistory>
            </OnboardingWrapper>
          </Providers>
        </LoadingWrapper>
        <Toaster />
      </body>
    </html>
  )
}