import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { FrameworkPage } from '@/components/frameworks/framework-page';
import { requireLocale } from '@/i18n/require-locale';
import { redirect } from '@/i18n/navigation';
import { decodeParam } from '@/lib/route-param';

interface FrameworkRouteProps {
  params: Promise<{ locale: string; framework: string }>;
  searchParams: Promise<{ rule?: string }>;
}

export default async function FrameworkRoute({ params, searchParams }: FrameworkRouteProps) {
  const { locale: rawLocale, framework } = await params;
  const locale = requireLocale(rawLocale);
  setRequestLocale(locale);
  const { rule } = await searchParams;
  // Links from before a rule had its own page used ?rule=R6.
  if (rule) {
    const href = `/frameworks/${framework}/rules/${encodeURIComponent(rule)}`;
    redirect({ href, locale });
  }
  const frameworkId = decodeParam(framework);
  if (frameworkId === null) notFound();

  return <FrameworkPage frameworkId={frameworkId} />;
}
