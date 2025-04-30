import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './constants';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});

/**
 * If you want i18n routing, use this instead of `next/link`.
 * ❌ import Link from 'next/link';
 * ✅ import { Link, redirect, usePathname, useRouter } from '@/i18n/routing';
 */
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
