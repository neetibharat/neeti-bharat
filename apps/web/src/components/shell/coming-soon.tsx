import { IconHourglassEmpty } from '@tabler/icons-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { PageHeader } from '@/components/base/page-header/page-header';
import { requireLocale } from '@/i18n/require-locale';

export type ComingSoonId =
  'dataMap' | 'connections' | 'noticeAndConsent' | 'notifications' | 'secrets' | 'aiHelp';

/**
 * Builds the page for a module that is not built yet: its title and one-line purpose,
 * and a note that it is on its way. When the module ships, its route file stops using this.
 */
export function comingSoon(id: ComingSoonId) {
  return async function ComingSoonPage({ params }: { params: Promise<{ locale: string }> }) {
    setRequestLocale(requireLocale((await params).locale));
    const t = await getTranslations();

    return (
      <>
        <PageHeader title={t(`pages.${id}.title`)} description={t(`pages.${id}.description`)} />
        <Card>
          <EmptyState
            icon={IconHourglassEmpty}
            title={t('comingSoon.title')}
            description={t('comingSoon.body')}
          />
        </Card>
      </>
    );
  };
}
