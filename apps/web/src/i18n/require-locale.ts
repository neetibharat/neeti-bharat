import type { Locale } from '@dpdp-kit/shared';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from './routing';

/** Narrows a route param to a supported locale, or renders the 404 page. */
export function requireLocale(raw: string): Locale {
  if (!hasLocale(routing.locales, raw)) notFound();
  return raw;
}
