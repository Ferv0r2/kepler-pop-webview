import { NextRequest, NextResponse } from 'next/server';

const supportedLocales = ['en', 'ko', 'ja', 'zh'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  // Get locale from cookie first
  const localeCookie = request.cookies.get('locale');
  let locale = localeCookie?.value || defaultLocale;

  // If no cookie, detect from Accept-Language header
  if (!localeCookie) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const preferredLang = acceptLanguage.split(',')[0].split('-')[0];
      if (supportedLocales.includes(preferredLang)) {
        locale = preferredLang;
      }
    }
  }

  // Validate locale
  if (!supportedLocales.includes(locale)) {
    locale = defaultLocale;
  }

  // Create response
  const response = NextResponse.next();

  // Set locale cookie if not exists or different
  if (!localeCookie || localeCookie.value !== locale) {
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 31536000, // 1 year
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // Add locale to response headers for use in app
  response.headers.set('x-locale', locale);

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc.)
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
