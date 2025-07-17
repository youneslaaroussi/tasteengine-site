import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@fontsource/jetbrains-mono";
import { GoogleAnalytics } from "@/components/google-analytics";
import { ExternalScript } from "@/components/external-script";
import { FlightSearchProvider } from '@/contexts/flight-search-context';
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
  title: "GoFlyTo - Your Travel Assistant",
  description: "AI-powered travel planning assistant",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GoFlyTo",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#da532c",
    "theme-color": "#ffffff",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable
        )}
      >
        <CountryPreloader />
        <FlightSearchProvider>
          {children}
        </FlightSearchProvider>
        <GoogleAnalytics />
        <ExternalScript />
      </body>
    </html>
  );
}
