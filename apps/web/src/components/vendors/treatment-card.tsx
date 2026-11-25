'use client';

import {
  VENDOR_TREATMENTS,
  VENDOR_TREATMENT_NOTE_MAX_LENGTH,
  type VendorResponse,
  type VendorTreatment,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { Textarea } from '@/components/base/textarea/textarea';
import { useCan } from '@/components/providers/user-provider';
import { useUpdateVendorMutation } from '@/lib/api/vendors-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { cx } from '@/lib/utils/cx';
import {
  toTreatmentRequest,
  toTreatmentValues,
  treatmentChanged,
  type TreatmentValues,
} from '@/lib/vendors';

/** The four things that can be decided, as tiles to choose from. One is chosen at a time. */
function Strategies(props: {
  value: VendorTreatment | null;
  isReadOnly: boolean;
  onPick: (treatment: VendorTreatment) => void;
}) {
  const t = useTranslations('vendors.risk.treatment');

  return (
    <div
      role="radiogroup"
      aria-label={t('strategy')}
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {VENDOR_TREATMENTS.map((treatment) => {
        const chosen = props.value === treatment;
        return (
          <button
            key={treatment}
            type="button"
            role="radio"
            aria-checked={chosen}
            disabled={props.isReadOnly}
            onClick={() => props.onPick(treatment)}
            className={cx(
              'flex flex-col gap-0.5 rounded-control p-3 text-left ring-1 ring-inset transition-colors',
              chosen ? 'bg-brand-soft ring-brand' : 'bg-surface ring-line-strong',
              !props.isReadOnly && !chosen && 'cursor-pointer hover:bg-surface-muted',
              props.isReadOnly && 'cursor-default',
            )}
          >
            <span className="text-label font-semibold text-fg">
              {t(`strategies.${treatment}.name`)}
            </span>
            <span className="text-caption text-fg-muted">{t(`strategies.${treatment}.about`)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Saves the decision, and says if that failed. Offered only while there is something to save. */
function SaveBar(props: { vendor: VendorResponse; values: TreatmentValues }) {
  const t = useTranslations('vendors.risk.treatment');
  const errorMessage = useErrorMessage();
  const [update, { isLoading, error }] = useUpdateVendorMutation();
  const { vendor, values } = props;

  return (
    <>
      {error ? <Alert tone="error">{errorMessage(error)}</Alert> : null}
      <div className="flex justify-end">
        <Button
          isDisabled={!treatmentChanged(vendor, values)}
          isLoading={isLoading}
          onPress={() => void update({ id: vendor.id, ...toTreatmentRequest(values) })}
        >
          {t('save')}
        </Button>
      </div>
    </>
  );
}

/** The decision about this vendor's risk: what will be done, and why. It is saved with the button, since a reason takes a moment to write. */
export function TreatmentCard({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors.risk.treatment');
  const { canEdit } = useCan();
  const [values, setValues] = useState<TreatmentValues>(toTreatmentValues(vendor));
  const isReadOnly = !canEdit || vendor.archivedAt !== null;

  return (
    <Card title={t('title')} description={t('description')}>
      <div className="flex flex-col gap-4">
        <Strategies
          value={values.treatment}
          isReadOnly={isReadOnly}
          onPick={(treatment) => setValues({ ...values, treatment })}
        />
        {!values.treatment && <p className="text-caption text-fg-subtle">{t('notDecided')}</p>}
        <Textarea
          label={t('rationale')}
          hint={t('rationaleHint')}
          value={values.note}
          onChange={(note) => setValues({ ...values, note })}
          maxLength={VENDOR_TREATMENT_NOTE_MAX_LENGTH}
          isReadOnly={isReadOnly}
          rows={3}
        />
        {!isReadOnly && <SaveBar vendor={vendor} values={values} />}
      </div>
    </Card>
  );
}
