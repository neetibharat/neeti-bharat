'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/base/page-header/page-header';
import { Tabs } from '@/components/base/tabs/tabs';
import { useCan } from '@/components/providers/user-provider';
import { ManageTrainings } from './manage-trainings';
import { MyPolicies } from './my-policies';
import { MyTraining } from './my-training';
import { TeamTraining } from './team-training';
import { AddTrainingButton } from './training-dialogs';

/** The trainings the company asks of everyone: your own, how the team is getting on, and, for admins, the trainings themselves. */
export function TrainingPage() {
  const t = useTranslations('training');
  const { canEdit, isAdmin } = useCan();
  const seesTeam = isAdmin || !canEdit;
  const tabs = [
    { id: 'mine', label: t('tabs.mine'), content: <MyTraining /> },
    { id: 'policies', label: t('tabs.policies'), content: <MyPolicies /> },
    ...(seesTeam ? [{ id: 'team', label: t('tabs.team'), content: <TeamTraining /> }] : []),
    ...(isAdmin ? [{ id: 'manage', label: t('tabs.manage'), content: <ManageTrainings /> }] : []),
  ];

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={isAdmin ? <AddTrainingButton /> : undefined}
      />
      <Tabs defaultSelectedKey="mine" tabs={tabs} />
    </>
  );
}
