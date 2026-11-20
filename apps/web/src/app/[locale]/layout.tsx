import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { MotionProvider } from '@/components/providers/motion-provider';
import { StoreProvider } from '@/components/providers/store-provider';
import { requireLocale } from '@/i18n/require-locale';
import { routing } from '@/i18n/routing';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import '../globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

interface LocaleParams {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('title'), description: t('description'), icons: { icon: '/icon.svg' } };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleParams & { children: ReactNode }) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);

  return (
    // The boot script may set the theme on <html> before React sees it, so that one attribute is allowed to differ.
    <html
      lang={locale}
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-page text-fg antialiased">
        <NextIntlClientProvider>
          <MotionProvider>
            <StoreProvider>{children}</StoreProvider>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
