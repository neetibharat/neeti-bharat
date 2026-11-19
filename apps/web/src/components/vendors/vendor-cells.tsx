'use client';

import type { VendorResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Link } from '@/i18n/navigation';

/** A day sent as YYYY-MM-DD, written for the reader. It has no time of day, so it is read as UTC to stay on that day. */
function useDay() {
  const format = useFormatter();
  return (value: string) =>
    format.dateTime(new Date(`${value}T00:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' });
}

/** The name, what the vendor does, and why it needs a look, when it does. */
export function VendorCell({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const tCategories = useTranslations('vendors.categories');

  return (
    <div className="min-w-0">
      <Link
        href={`/vendors/${vendor.id}`}
        className="block truncate font-medium text-fg hover:text-brand hover:underline"
      >
        {vendor.name}
      </Link>
      <p className="line-clamp-2 text-caption text-fg-subtle">{vendor.service}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-subtle">
        <Badge>{tCategories(vendor.category)}</Badge>
        {vendor.attention.length > 0 && (
          <span className="text-accent">
            {vendor.attention.map((reason) => t(`attention.${reason}`)).join(' · ')}
          </span>
        )}
      </p>
    </div>
  );
}

/** The kinds of data the vendor is given, and where it keeps them. */
export function DataCell({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const tKinds = useTranslations('vendors.dataKinds');
  const tLocations = useTranslations('vendors.locations');

  return (
    <div>
      <p className="text-label text-fg">
        {vendor.dataKinds.length > 0
          ? vendor.dataKinds.map((kind) => tKinds(kind)).join(', ')
          : t('noData')}
      </p>
      <p className="text-caption text-fg-subtle">{tLocations(vendor.location ?? 'notSaid')}</p>
    </div>
  );
}

const STATUS_COLORS = {
  not_assessed: 'gray',
  in_progress: 'warning',
  assessed: 'success',
} as const;

/** How far the company has got with looking at the vendor, and the day it is next due. */
export function StatusCell({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors');
  const tStatus = useTranslations('vendors.status');
  const day = useDay();

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge color={STATUS_COLORS[vendor.status]}>{tStatus(vendor.status)}</Badge>
      {vendor.nextReviewOn && (
        <p className="text-caption text-fg-subtle">
          {t('nextReview', { date: day(vendor.nextReviewOn) })}
        </p>
      )}
    </div>
  );
}
