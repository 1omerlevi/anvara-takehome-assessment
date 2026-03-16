import process from 'node:process';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Nav } from './components/nav';

// TODO: Add ErrorBoundary wrapper for graceful error handling
// TODO: Consider adding a loading.tsx for Suspense boundaries

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const metadataBase = new URL(siteUrl);
const defaultTitle = 'Anvara Marketplace | Sponsorships for Modern Brands';
const defaultDescription =
  'Sponsorship marketplace connecting sponsors with publishers through premium inventory discovery and streamlined booking workflows.';
const socialImage = '/pga-tour-tahoe-championship.jpeg';

export const metadata: Metadata = {
  metadataBase,
  applicationName: 'Anvara Marketplace',
  title: {
    default: defaultTitle,
    template: '%s | Anvara Marketplace',
  },
  description: defaultDescription,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    type: 'website',
    siteName: 'Anvara Marketplace',
    url: '/',
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: 'Anvara marketplace sponsorship opportunities showcase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [socialImage],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // HINT: If using React Query, you would wrap children with QueryClientProvider here
  // See: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
