import { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ReactNode } from 'react';

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WebViewBridgeProvider>{children}</WebViewBridgeProvider>
      </body>
    </html>
  );
}
