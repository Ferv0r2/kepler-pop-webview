import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(ko|en|ja|zh|zh-TW|es|fr|de|ru|pt|it|ar|hi)/:path*'],
};
