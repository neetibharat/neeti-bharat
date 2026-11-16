import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { requireLocale } from '@/i18n/require-locale';
import { firstLiveHref } from '@/lib/navigation';

/** /settings has no page of its own: it opens the first section that exists. */
export default async function SettingsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  return redirect({ href: firstLiveHref('settings'), locale });
}
