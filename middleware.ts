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
  let hasAccessToken = false;
  let refreshTokenExpired = false;

  if (authStorage) {
    try {
      const authData = typeof authStorage === 'string' ? JSON.parse(authStorage) : authStorage;
      hasAccessToken = !!authData.state?.accessToken;
      const refreshToken = authData.state?.refreshToken;
      if (!refreshToken) {
        refreshTokenExpired = true;
      } else {
        const payload = parseJwt(refreshToken);
        if (
          !payload ||
          typeof payload !== 'object' ||
          payload === null ||
          !('exp' in payload) ||
          typeof (payload as { exp?: number }).exp !== 'number' ||
          (payload as { exp: number }).exp * 1000 < Date.now()
        ) {
          refreshTokenExpired = true;
        }
      }
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
      const response = NextResponse.next();
      response.cookies.delete('auth-storage');
      return response;
    }
  } else {
    refreshTokenExpired = true;
  }

  const currentLocale = getPreferredLocale(request);

  const pathname = request.nextUrl.pathname;

  if (pathname.includes('/auth')) {
    if (hasAccessToken) {
      const redirectUrl = new URL(`/${currentLocale}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  if (!hasAccessToken || refreshTokenExpired) {
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
