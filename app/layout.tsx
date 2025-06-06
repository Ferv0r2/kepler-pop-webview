import { GoogleOAuthProvider } from '@react-oauth/google';
import { Metadata } from 'next';
import { Geist, Geist_Mono, Press_Start_2P } from 'next/font/google';
import { ReactNode } from 'react';

import { Logo } from '@/components/logo/Logo';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { WebViewBridgeProvider } from '@/components/providers/WebViewBridgeProvider';
import { InitialLoaderRemover } from '@/components/ui/InitialLoader';
import { StarsAndSparkles } from '@/components/ui/StarsAndSparkles';

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
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            #initial-loader {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              background-color: #0A1128;
              z-index: 9999;
            }
            /* Stars background */
            .star {
              position: absolute;
              background-color: #FFEB3B;
              border-radius: 50%;
              opacity: 0.2;
              animation: twinkle 2s infinite ease-in-out;
            }
            @keyframes twinkle {
              0%, 100% {
                opacity: 0.2;
                transform: scale(0.8);
              }
              50% {
                opacity: 1;
                transform: scale(1.2);
              }
            }
            /* Sparkles */
            .sparkle {
              position: absolute;
              animation: sparkleAnim 2.5s infinite;
            }
            @keyframes sparkleAnim {
              0% {
                opacity: 0;
                transform: scale(0.5) rotate(0deg);
              }
              25% {
                opacity: 1;
                transform: scale(1) rotate(90deg);
              }
              50% {
                opacity: 1;
                transform: scale(1) rotate(180deg);
              }
              75% {
                opacity: 0;
                transform: scale(0.5) rotate(270deg);
              }
              100% {
                opacity: 0;
                transform: scale(0.5) rotate(360deg);
              }
            }
            /* Loading dots */
            .loading-container {
              position: absolute;
              bottom: 50px;
              display: flex;
              justify-content: center;
            }
            .dots-container {
              display: flex;
              align-items: center;
            }
            .dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #FFFFFF;
              margin: 0 3px;
            }
            .dot:nth-child(1) {
              animation: jumpDot 1.2s infinite ease-in-out;
            }
            .dot:nth-child(2) {
              animation: jumpDot 1.2s infinite ease-in-out 0.2s;
            }
            .dot:nth-child(3) {
              animation: jumpDot 1.2s infinite ease-in-out 0.4s;
            }
            @keyframes jumpDot {
              0%, 100% {
                transform: translateY(0);
                opacity: 0.5;
              }
              50% {
                transform: translateY(-10px);
                opacity: 1;
              }
            }
          `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased`}>
        <div id="initial-loader" aria-busy="true" role="status" tabIndex={-1}>
          <StarsAndSparkles />
          <Logo className="mt-24" />
          <div className="loading-container">
            <div className="dots-container">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>
        <InitialLoaderRemover />
        <QueryProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
            <WebViewBridgeProvider>{children}</WebViewBridgeProvider>
          </GoogleOAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
