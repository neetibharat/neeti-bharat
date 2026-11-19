'use client';

import type { VendorResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { useCan } from '@/components/providers/user-provider';
import type { VendorSection } from '@/lib/vendors';
import { EditVendorButton } from './edit-vendor-button';
import { VendorRiskBadge } from './vendor-risk';

const STATUS_COLORS = {
  not_assessed: 'gray',
  in_progress: 'warning',
  assessed: 'success',
} as const;

/** A day sent as YYYY-MM-DD, written for the reader, or a dash when there is none. Read as UTC so it stays on that day. */
function useDay() {
  const format = useFormatter();
  return (value: string | null) =>
    value
      ? format.dateTime(new Date(`${value}T00:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' })
      : '—';
}

/** One part of the vendor as a card, with a button to change it when the person may and the vendor is in use. */
function SectionCard(props: {
  vendor: VendorResponse;
  section: VendorSection;
  children: ReactNode;
}) {
  const t = useTranslations('vendors.sections');
  const { canEdit } = useCan();
  const editable = canEdit && !props.vendor.archivedAt;

  return (
    <Card
      title={t(`${props.section}.title`)}
      description={t(`${props.section}.description`)}
      actions={
        editable ? <EditVendorButton vendor={props.vendor} section={props.section} /> : undefined
      }
    >
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{props.children}</dl>
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 break-words text-body text-fg">{children}</dd>
    </div>
  );
}

const linkClass = 'text-brand underline underline-offset-2 hover:no-underline';

/** A web address as a link that opens in a new tab, or a dash when there is none. */
function WebLink({ href, label }: { href: string | null; label?: string }) {
  if (!href) return '—';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {label ?? href}
    </a>
  );
}

export function DetailsCard({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const tCategories = useTranslations('vendors.categories');
  const tStatus = useTranslations('vendors.status');

  return (
    <SectionCard vendor={vendor} section="details">
      <Fact label={t('form.status')}>
        <Badge color={STATUS_COLORS[vendor.status]}>{tStatus(vendor.status)}</Badge>
      </Fact>
      <Fact label={t('risk.title')}>
        <VendorRiskBadge vendor={vendor} />
      </Fact>
      <Fact label={t('form.category')}>{tCategories(vendor.category)}</Fact>
      <Fact label={t('form.owner')}>{vendor.owner?.name ?? t('noOwner')}</Fact>
      <Fact label={t('form.website')}>
        <WebLink href={vendor.website} />
      </Fact>
    </SectionCard>
  );
}

export function DataCard({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const tKinds = useTranslations('vendors.dataKinds');
  const tLocations = useTranslations('vendors.locations');

  return (
    <SectionCard vendor={vendor} section="data">
      <Fact label={t('form.location')}>{tLocations(vendor.location ?? 'notSaid')}</Fact>
      <Fact label={t('form.data')}>
        {vendor.dataKinds.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {vendor.dataKinds.map((kind) => (
              <Badge key={kind}>{tKinds(kind)}</Badge>
            ))}
          </span>
        ) : (
          t('noData')
        )}
      </Fact>
    </SectionCard>
  );
}

export function ReviewCard({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const day = useDay();

  return (
    <SectionCard vendor={vendor} section="review">
      <Fact label={t('form.agreementUrl')}>
        <WebLink href={vendor.agreementUrl} label={t('openAgreement')} />
      </Fact>
      <Fact label={t('form.nextReviewOn')}>{day(vendor.nextReviewOn)}</Fact>
    </SectionCard>
  );
}
