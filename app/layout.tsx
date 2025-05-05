import { GoogleOAuthProvider } from '@react-oauth/google';
import { Metadata } from 'next';
import { Geist, Geist_Mono, Press_Start_2P } from 'next/font/google';
import { ReactNode } from 'react';

import { QueryProvider } from '@/components/providers/QueryProvider';
import { WebViewBridgeProvider } from '@/components/providers/WebViewBridgeProvider';

import '@/styles/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
});

export const metadata: Metadata = {
  title: 'Kepler Pop',
  description: 'Kepler Pop with Puzzle Game',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased`}>
        <QueryProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
            <WebViewBridgeProvider>{children}</WebViewBridgeProvider>
          </GoogleOAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
