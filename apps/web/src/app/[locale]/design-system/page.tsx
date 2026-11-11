import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/base/page-header/page-header';
import { requireLocale } from '@/i18n/require-locale';
import { Sections } from './sections';

/**
 * Developer-only style guide. It shows every token and component in one place so changes are
 * judged side by side. Its demo text is English on purpose and it is a 404 in production.
 */
export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(requireLocale((await params).locale));
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        title="Design system"
        description="Every token and component, with its sizes and states. Change tokens in styles/theme.css."
      />
      <Sections />
    </main>
  );
}
