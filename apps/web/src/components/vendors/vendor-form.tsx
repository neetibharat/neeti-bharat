'use client';

import { useTranslations } from 'next-intl';
import type { FormEvent, ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useFormDraft } from '@/lib/hooks/use-form-draft';
import { canSaveVendor, type VendorSection, type VendorValues } from '@/lib/vendors';
import { DataFields, DetailsFields, ReviewFields, type FieldsProps } from './vendor-fields';

const FIELDS: Record<VendorSection, (props: FieldsProps) => ReactNode> = {
  details: DetailsFields,
  data: DataFields,
  review: ReviewFields,
};

export interface VendorFormProps {
  /** The part of the vendor this form fills in. */
  section: VendorSection;
  initial: VendorValues;
  submitLabel: string;
  isSaving: boolean;
  error: unknown;
  onSubmit: (values: VendorValues) => void;
  onCancel: () => void;
}

/** A short form for one part of a vendor: its details, its data, its agreement, or its review. */
export function VendorForm(props: VendorFormProps) {
  const t = useTranslations('vendors.form');
  const errorMessage = useErrorMessage();
  const [values, patch] = useFormDraft(props.initial);
  const Fields = FIELDS[props.section];

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit(values);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Fields values={values} onChange={patch} />
      {props.error ? <Alert tone="error">{errorMessage(props.error)}</Alert> : null}
      <FormActions
        cancelLabel={t('cancel')}
        submitLabel={props.submitLabel}
        onCancel={props.onCancel}
        isDisabled={!canSaveVendor(props.section, values)}
        isLoading={props.isSaving}
      />
    </form>
  );
}
