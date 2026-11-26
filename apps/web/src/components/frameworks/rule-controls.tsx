'use client';

import type { RuleResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { AddControlButton } from './add-control-button';
import { ControlRow } from './control-row';

/** The controls under a rule: what each asks, who owns it and what is still missing. */
export function RuleControls({ rule, canEdit }: { rule: RuleResponse; canEdit: boolean }) {
  const t = useTranslations('frameworks.rulePage.controls');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-label text-fg-muted">{t('hint')}</p>
        {canEdit && <AddControlButton requirementId={rule.id} color="secondary" />}
      </div>
      <div className="overflow-hidden rounded-card border border-line/70 bg-surface shadow-card">
        <ul className="divide-y divide-line">
          {rule.controls.map((control) => (
            <ControlRow key={control.id} control={control} canEdit={canEdit} />
          ))}
        </ul>
      </div>
    </div>
  );
}
