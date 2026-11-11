'use client';

import { useTranslations } from 'next-intl';
import { SegmentedControl } from '@/components/base/segmented-control/segmented-control';
import { useRouter } from '@/i18n/navigation';
import { requestsHref, type RequestViewMode } from '@/lib/request-board';

/** Changes the view by changing the address, which is where the view is kept. */
export function useSetViewMode() {
  const router = useRouter();
  return (mode: RequestViewMode) => router.replace(requestsHref(mode), { scroll: false });
}

/** Board or List, at the right above the requests. */
export function RequestsViewSwitch({ mode }: { mode: RequestViewMode }) {
  const t = useTranslations('requests.view');
  const setMode = useSetViewMode();

  return (
    <SegmentedControl
      aria-label={t('label')}
      value={mode}
      onChange={setMode}
      options={[
        { id: 'board', label: t('board') },
        { id: 'list', label: t('list') },
      ]}
    />
  );
}
