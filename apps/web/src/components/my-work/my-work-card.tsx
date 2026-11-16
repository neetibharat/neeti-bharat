'use client';

import { IconCircleCheck } from '@tabler/icons-react';
import type { MyWorkItem } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Tabs, type TabItem } from '@/components/base/tabs/tabs';
import { groupMyWork } from '@/lib/my-work-groups';
import { MY_WORK_TABS, onMyWorkTab } from '@/lib/my-work-tabs';
import { MyWorkRow } from './my-work-row';

/** The work as tabs by kind; inside each, sections by how soon it is due. `isOther` words the empty state for someone else. */
export function MyWorkCard(props: { items: MyWorkItem[]; isOther: boolean; now: Date }) {
  const { items, isOther, now } = props;
  const t = useTranslations('dashboard.work');

  return (
    <Card title={t('title')} description={t('description')}>
      {items.length === 0 ? (
        <EmptyState
          icon={IconCircleCheck}
          title={t('empty.title')}
          description={isOther ? t('empty.textOther') : t('empty.text')}
        />
      ) : (
        <WorkTabs items={items} now={now} />
      )}
    </Card>
  );
}

function WorkTabs({ items, now }: { items: MyWorkItem[]; now: Date }) {
  const t = useTranslations('dashboard.work');
  const tabs: TabItem[] = MY_WORK_TABS.map((tab) => {
    const rows = onMyWorkTab(items, tab);
    return {
      id: tab,
      label: t(`tabs.${tab}`, { count: rows.length }),
      content: rows.length ? (
        <Sections items={rows} now={now} />
      ) : (
        <p className="text-body text-fg-muted">{t('nothingHere')}</p>
      ),
    };
  });

  return <Tabs tabs={tabs} />;
}

function Sections({ items, now }: { items: MyWorkItem[]; now: Date }) {
  const t = useTranslations('dashboard.work.groups');

  return (
    <div className="flex flex-col gap-6">
      {groupMyWork(items, now).map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <h3 className="text-label font-semibold text-fg">
            {t(group.id)} <span className="font-normal text-fg-subtle">{group.items.length}</span>
          </h3>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => (
              <MyWorkRow key={`${item.kind}:${item.id}`} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
