import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { DEFAULT_LOCALE, isSupportedLocale } from '@/i18n/constants';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  // i18n
  const response = intlMiddleware(request);

  const authStorage = request.cookies.get('auth-storage')?.value;
  let hasAccessToken = false;

  if (authStorage) {
    try {
      const authData = typeof authStorage === 'string' ? JSON.parse(authStorage) : authStorage;
      hasAccessToken = !!authData.state?.accessToken;
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
      const response = NextResponse.next();
      response.cookies.delete('auth-storage');
      return response;
    }
  }

  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1];
  const currentLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  if (pathname.includes('/auth')) {
    if (hasAccessToken) {
      const redirectUrl = new URL(`/${currentLocale}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  if (!hasAccessToken) {
    const redirectUrl = new URL(`/${currentLocale}/auth`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/', '/(ko|en|ja|zh|zh-TW|es|fr|de|ru|pt|it|ar|hi)/:path*'],
};
