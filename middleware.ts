import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { DEFAULT_LOCALE, isSupportedLocale } from '@/i18n/constants';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

function getPreferredLocale(request: NextRequest): string {
  // Cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;

  // Accept-Language
  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    const preferred = acceptLang
      .split(',')
      .map((lang) => lang.split(';')[0].trim())
      .find(isSupportedLocale);
    if (preferred) return preferred;
  }

  return DEFAULT_LOCALE;
}

// JWT payload 파싱 함수 추가
function parseJwt(token: string): unknown {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  // i18n
  const response = intlMiddleware(request);

  const authStorage = request.cookies.get('auth-storage')?.value;
  let hasValidAuth = false;
  let refreshTokenExpired = false;

  if (authStorage) {
    try {
      const authData = typeof authStorage === 'string' ? JSON.parse(authStorage) : authStorage;
      const accessToken = authData.state?.accessToken;
      const refreshToken = authData.state?.refreshToken;

      // access token이 있고, refresh token이 유효하면 인증된 것으로 간주
      if (accessToken && refreshToken) {
        const refreshPayload = parseJwt(refreshToken);
        if (
          refreshPayload &&
          typeof refreshPayload === 'object' &&
          refreshPayload !== null &&
          'exp' in refreshPayload &&
          typeof (refreshPayload as { exp?: number }).exp === 'number' &&
          (refreshPayload as { exp: number }).exp * 1000 > Date.now()
        ) {
          hasValidAuth = true;
          console.log('[Middleware] Valid auth found, refresh token valid');
        } else {
          refreshTokenExpired = true;
          console.log('[Middleware] Refresh token expired');
        }
      } else {
        refreshTokenExpired = true;
        console.log('[Middleware] Missing tokens');
      }
    } catch (error) {
      console.error('[Middleware] Failed to parse auth storage:', error);
      const response = NextResponse.next();
      response.cookies.delete('auth-storage');
      return response;
    }
  } else {
    refreshTokenExpired = true;
    console.log('[Middleware] No auth storage found');
  }

  const currentLocale = getPreferredLocale(request);
  const pathname = request.nextUrl.pathname;

  // 로그인 페이지 접근
  if (pathname.includes('/auth')) {
    if (hasValidAuth) {
      console.log('[Middleware] Already authenticated, redirecting to home');
      const redirectUrl = new URL(`/${currentLocale}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // 인증이 필요한 페이지 접근
  if (!hasValidAuth || refreshTokenExpired) {
    console.log('[Middleware] Auth required, redirecting to login');
    const response = NextResponse.next();
    response.cookies.delete('auth-storage');
    const redirectUrl = new URL(`/${currentLocale}/auth`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/', '/(ko|en|ja|zh|zh-TW|es|pt)/:path*'],
};
