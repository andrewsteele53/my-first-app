import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  siteDescription,
  siteDescriptionWithTagline,
  siteName,
  siteTitle,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescriptionWithTagline,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[var(--color-app-bg)] text-[var(--color-text)] antialiased"
      >
        {children}
      </body>
    </html>
  );
}
