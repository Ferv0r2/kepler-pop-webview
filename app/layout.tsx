import { GoogleOAuthProvider } from '@react-oauth/google';
import { Metadata, Viewport } from 'next';
import { Press_Start_2P } from 'next/font/google';
import localFont from 'next/font/local';
import Script from 'next/script';
import { ReactNode } from 'react';

// import { PreloadDebugger } from '@/components/debug/PreloadDebugger';
import { Logo } from '@/components/logo/Logo';
import { GlobalPreloadProvider } from '@/components/providers/GlobalPreloadProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { WebViewBridgeProvider } from '@/components/providers/WebViewBridgeProvider';
import { InitialLoaderRemover } from '@/components/ui/InitialLoader';
import { StarsAndSparkles } from '@/components/ui/StarsAndSparkles';

import '@/styles/globals.css';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
});

const neodgmFont = localFont({
  src: '../styles/fonts/neodgm.woff2',
  variable: '--font-neodgm',
  display: 'swap',
});

const pixelMplusFont = localFont({
  src: [
    {
      path: '../styles/fonts/PixelMplus10-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../styles/fonts/PixelMplus10-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../styles/fonts/PixelMplus12-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../styles/fonts/PixelMplus12-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pixelmplus',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kepler Pop',
  description: 'Kepler Pop with Puzzle Game',
  // 모바일 WebView 최적화
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kepler Pop',
  },
  formatDetection: {
    telephone: false, // 전화번호 자동 링크 비활성화
    date: false, // 날짜 자동 링크 비활성화
    address: false, // 주소 자동 링크 비활성화
    email: false, // 이메일 자동 링크 비활성화
    url: false, // URL 자동 링크 비활성화
  },
  other: {
    // iOS Safari WebView 최적화
    'mobile-web-app-capable': 'yes',
    'mobile-web-app-status-bar-style': 'default',
    // Android WebView 최적화
    'mobile-web-app-title': 'Kepler Pop',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // 모바일 WebView 최적화
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0B0C1D' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0C1D' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" style={{ background: 'linear-gradient(to bottom, #0B0C1D, #101340)' }}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            html, body {
              background: linear-gradient(to bottom, #0B0C1D, #101340) !important;
              margin: 0;
              padding: 0;
              min-height: 100vh;
            }
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 웹뷰 확대/축소 및 스크롤 방지
              (function() {
                
                // 스크롤 방지 (가로 스크롤만 방지)
                document.addEventListener('touchmove', function(e) {
                  if (e.touches.length > 1) {
                    e.preventDefault();
                  }
                  // 가로 스크롤 방지
                  if (Math.abs(e.touches[0].clientX - e.touches[0].screenX) > 10) {
                    e.preventDefault();
                  }
                }, { passive: false });
                
                // 컨텍스트 메뉴 방지
                document.addEventListener('contextmenu', function(e) {
                  e.preventDefault();
                });
                
                // 키보드 확대/축소 방지
                document.addEventListener('keydown', function(e) {
                  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
                    e.preventDefault();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className={`${pixelMplusFont.variable} ${pressStart2P.variable} ${neodgmFont.variable} antialiased`}>
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WMZSQPNR');
            `,
          }}
        />

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WMZSQPNR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

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
          <GlobalPreloadProvider>
            {process.env.NODE_ENV === 'development' ? (
              <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
                <WebViewBridgeProvider>
                  {children}
                  {/* <PreloadDebugger /> */}
                </WebViewBridgeProvider>
              </GoogleOAuthProvider>
            ) : (
              <WebViewBridgeProvider>
                {children}
                {/* <PreloadDebugger /> */}
              </WebViewBridgeProvider>
            )}
          </GlobalPreloadProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
