import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { DEFAULT_LOCALE, isSupportedLocale } from '@/i18n/constants';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

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
  const pathname = request.nextUrl.pathname;

  // 중복 로케일 경로 정리 (예: /ko/en/auth -> /ko/auth)
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length >= 2 && isSupportedLocale(pathSegments[0]) && isSupportedLocale(pathSegments[1])) {
    // 중복 로케일 감지: /ko/en/auth 같은 경우
    const correctPath = `/${pathSegments[0]}/${pathSegments.slice(2).join('/')}`;
    console.log(`[Middleware] Fixing duplicate locale: ${pathname} -> ${correctPath}`);
    return NextResponse.redirect(new URL(correctPath, request.url));
  }

  // i18n 미들웨어 실행
  const response = intlMiddleware(request);

  // intl 미들웨어가 리다이렉트를 반환했다면 그대로 사용
  if (response.status === 307 || response.status === 308) {
    return response;
  }

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
        if (refreshPayload && typeof refreshPayload === 'object' && refreshPayload !== null) {
          // 게스트 토큰인지 확인
          const isGuestToken = 'type' in refreshPayload && refreshPayload.type === 'guest';

          if (isGuestToken) {
            // 게스트 토큰은 100년 만료이므로 만료 체크 없이 유효로 처리
            hasValidAuth = true;
            console.log('[Middleware] Valid guest auth found');
          } else if (
            'exp' in refreshPayload &&
            typeof (refreshPayload as { exp?: number }).exp === 'number' &&
            (refreshPayload as { exp: number }).exp * 1000 > Date.now()
          ) {
            hasValidAuth = true;
            console.log('[Middleware] Valid user auth found, refresh token valid');
          } else {
            refreshTokenExpired = true;
            console.log('[Middleware] User refresh token expired');
          }
        } else {
          refreshTokenExpired = true;
          console.log('[Middleware] Invalid token payload');
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

  // 현재 경로에서 locale 추출 (이미 위에서 pathSegments 계산됨)
  const currentLocaleFromPath =
    pathSegments[0] && isSupportedLocale(pathSegments[0]) ? pathSegments[0] : DEFAULT_LOCALE;

  // 로그인 페이지 접근
  if (pathname.includes('/auth')) {
    if (hasValidAuth) {
      console.log('[Middleware] Already authenticated, redirecting to home');
      const redirectUrl = new URL(`/${currentLocaleFromPath}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // 인증이 필요한 페이지 접근
  if (!hasValidAuth || refreshTokenExpired) {
    console.log('[Middleware] Auth required, redirecting to login');
    const response = NextResponse.next();
    response.cookies.delete('auth-storage');
    const redirectUrl = new URL(`/${currentLocaleFromPath}/auth`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/', '/(ko|en|ja|zh|zh-TW|es|pt)/:path*'],
};
