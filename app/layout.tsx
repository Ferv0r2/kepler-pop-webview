import { GoogleOAuthProvider } from '@react-oauth/google';
import { Metadata } from 'next';
import { Geist, Geist_Mono, Press_Start_2P } from 'next/font/google';
import { ReactNode } from 'react';

import { QueryProvider } from '@/components/providers/QueryProvider';
import { WebViewBridgeProvider } from '@/components/providers/WebViewBridgeProvider';
import '@/styles/globals.css';
import { InitialLoaderRemover } from '@/components/ui/InitialLoader';
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
              justify-content: center;
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
            /* Title styles */
            .title-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 40px;
            }
            .title-kepler {
              font-family: var(--font-press-start);
              font-size: 48px;
              font-weight: bold;
              color: #FFF9C4;
              text-shadow: 2px 2px 1px #795548;
            }
            .title-pop {
              font-family: var(--font-press-start);
              font-size: 48px;
              font-weight: bold;
              color: #FF9800;
              text-shadow: 2px 2px 1px #795548;
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
          <div className="title-container">
            <div className="title-kepler">KEPLER</div>
            <div className="title-pop">POP</div>
          </div>
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function createStars() {
              var loaderElement = document.getElementById('initial-loader');
              if (!loaderElement) return;
              var width = window.innerWidth;
              var height = window.innerHeight;
              for (var i = 0; i < 20; i++) {
                var star = document.createElement('div');
                star.className = 'star';
                var size = Math.random() * 4 + 2;
                star.style.width = size + 'px';
                star.style.height = size + 'px';
                star.style.left = Math.random() * width + 'px';
                star.style.top = Math.random() * height + 'px';
                star.style.animationDelay = Math.random() * 2 + 's';
                loaderElement.appendChild(star);
              }
              var sparklePositions = [
                { x: width * 0.2, y: height * 0.3, size: 24, delay: 0 },
                { x: width * 0.8, y: height * 0.2, size: 16, delay: 0.5 },
                { x: width * 0.3, y: height * 0.7, size: 20, delay: 1 },
                { x: width * 0.7, y: height * 0.6, size: 18, delay: 1.5 }
              ];
              sparklePositions.forEach(function(sp) {
                var sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.style.left = sp.x + 'px';
                sparkle.style.top = sp.y + 'px';
                sparkle.style.animationDelay = sp.delay + 's';
                sparkle.innerHTML = '<svg width="' + sp.size + '" height="' + sp.size + '" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFEB3B" stroke="#FFF" stroke-width="1" /></svg>';
                loaderElement.appendChild(sparkle);
              });
            })();
          `,
          }}
        />
      </body>
    </html>
  );
}
