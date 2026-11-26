'use client';

import {
  VENDOR_CATEGORIES,
  VENDOR_DATA_KINDS,
  VENDOR_LOCATIONS,
  VENDOR_NAME_MAX_LENGTH,
  VENDOR_SERVICE_MAX_LENGTH,
  VENDOR_STATUSES,
  type VendorDataKind,
} from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { DatePicker } from '@/components/base/date-picker/date-picker';
import { Input } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { Textarea } from '@/components/base/textarea/textarea';
import { AssigneeSelect } from '@/components/frameworks/assignee-select';
import type { VendorValues } from '@/lib/vendors';

export interface FieldsProps {
  values: VendorValues;
  onChange: (change: Partial<VendorValues>) => void;
}

/** The choice for a place that has not been said yet. */
const NOT_SAID = 'notSaid';
const PLACES = [NOT_SAID, ...VENDOR_LOCATIONS] as const;

/** Who the vendor is, what it does, who answers for it, and how far it has been assessed. All a new vendor needs. */
export function DetailsFields({ values, onChange }: FieldsProps) {
  const t = useTranslations('vendors.form');

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t('name')}
        value={values.name}
        onChange={(name) => onChange({ name })}
        maxLength={VENDOR_NAME_MAX_LENGTH}
        isRequired
        autoFocus
      />
      <Input
        type="url"
        label={t('website')}
        placeholder="https://"
        value={values.website}
        onChange={(website) => onChange({ website })}
      />
      <Textarea
        label={t('service')}
        hint={t('serviceHint')}
        value={values.service}
        onChange={(service) => onChange({ service })}
        maxLength={VENDOR_SERVICE_MAX_LENGTH}
        rows={2}
        isRequired
      />
      <KindAndStatus values={values} onChange={onChange} />
      <AssigneeSelect
        label={t('owner')}
        noneLabel={t('noOwner')}
        value={values.ownerId}
        onChange={(ownerId) => onChange({ ownerId })}
      />
    </div>
  );
}

/** The kind of service, and how far the vendor has been assessed. */
function KindAndStatus({ values, onChange }: FieldsProps) {
  const t = useTranslations('vendors.form');
  const tCategories = useTranslations('vendors.categories');
  const tStatuses = useTranslations('vendors.status');

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label={t('category')}
        options={VENDOR_CATEGORIES.map((id) => ({ id, label: tCategories(id) }))}
        selectedKey={values.category}
        onSelectionChange={(category) => onChange({ category })}
      />
      <Select
        label={t('status')}
        options={VENDOR_STATUSES.map((id) => ({ id, label: tStatuses(id) }))}
        selectedKey={values.status}
        onSelectionChange={(status) => onChange({ status })}
      />
    </div>
  );
}

/** Where the vendor keeps the data, and the kinds of personal data it is given. */
export function DataFields({ values, onChange }: FieldsProps) {
  const t = useTranslations('vendors.form');
  const tKinds = useTranslations('vendors.dataKinds');
  const tLocations = useTranslations('vendors.locations');
  const toggle = (kind: VendorDataKind, on: boolean) =>
    onChange({
      dataKinds: on ? [...values.dataKinds, kind] : values.dataKinds.filter((k) => k !== kind),
    });

  return (
    <div className="flex flex-col gap-4">
      <Select
        label={t('location')}
        options={PLACES.map((id) => ({ id, label: tLocations(id) }))}
        selectedKey={values.location ?? NOT_SAID}
        onSelectionChange={(key) => onChange({ location: key === NOT_SAID ? null : key })}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-label font-medium text-fg">{t('data')}</legend>
        <p className="text-caption text-fg-subtle">{t('dataHint')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {VENDOR_DATA_KINDS.map((kind) => (
            <Checkbox
              key={kind}
              isSelected={values.dataKinds.includes(kind)}
              onChange={(on) => toggle(kind, on)}
            >
              {tKinds(kind)}
            </Checkbox>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/** A link to the agreement, kept in the company's own storage, and the day to look at the vendor again. */
export function ReviewFields({ values, onChange }: FieldsProps) {
  const t = useTranslations('vendors.form');

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="url"
        label={t('agreementUrl')}
        hint={t('agreementUrlHint')}
        placeholder="https://"
        value={values.agreementUrl}
        onChange={(agreementUrl) => onChange({ agreementUrl })}
      />
      <DatePicker
        label={t('nextReviewOn')}
        clearLabel={t('clearDate')}
        openLabel={t('openCalendar')}
        value={values.nextReviewOn}
        onChange={(nextReviewOn) => onChange({ nextReviewOn })}
      />
    </div>
  );
}
