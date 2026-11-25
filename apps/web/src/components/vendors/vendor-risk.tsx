'use client';

import {
  riskReading,
  type RiskReading,
  type VendorRating,
  type VendorResponse,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { useCan } from '@/components/providers/user-provider';
import { useUpdateVendorMutation } from '@/lib/api/vendors-api';
import { LEVEL_BADGE, currentRisk } from '@/lib/vendor-risk';
import { RatingPicker } from './rating-picker';
import { RiskFigures } from './risk-figures';
import { RiskMap } from './risk-map';
import { ReductionCard } from './reduction-card';
import { TreatmentCard } from './treatment-card';

/** The vendor's risk as a badge, for a list. "Not rated yet" until someone rates it. */
export function VendorRiskBadge({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors.risk');
  const risk = currentRisk(vendor);
  if (!risk) return <span className="text-caption text-fg-subtle">{t('notRated')}</span>;

  return <Badge color={LEVEL_BADGE[risk.level]}>{t(`levels.${risk.level}`)}</Badge>;
}

const readingOf = (rating: VendorRating | null): RiskReading | null =>
  rating ? riskReading(rating) : null;

/** The risk on a map, with the figures beside it: now, before and after, and what changed. */
function Summary({ vendor }: { vendor: VendorResponse }) {
  const t = useTranslations('vendors.risk');

  return (
    <Card title={t('summary.title')} description={t('summary.description')}>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <RiskFigures before={readingOf(vendor.inherent)} after={readingOf(vendor.residual)} />
        <RiskMap vendor={vendor} />
      </div>
    </Card>
  );
}

type Which = 'inherent' | 'residual';

/** The two questions that place one risk. A change is saved at once. */
function RiskPanel({ vendor, which }: { vendor: VendorResponse; which: Which }) {
  const t = useTranslations('vendors.risk');
  const { canEdit } = useCan();
  const [update] = useUpdateVendorMutation();
  const rating = vendor[which];
  const save = (next: VendorRating | null) => void update({ id: vendor.id, [which]: next });

  return (
    <Card title={t(`${which}.title`)} description={t(`${which}.hint`)}>
      <RatingPicker
        // A new key when the saved rating changes, so the picker starts again from what was saved.
        key={rating ? `${rating.likelihood}:${rating.impact}` : 'none'}
        rating={rating}
        suggested={which === 'inherent' ? vendor.suggested : null}
        isReadOnly={!canEdit || vendor.archivedAt !== null}
        onChange={save}
        onClear={() => save(null)}
      />
    </Card>
  );
}

/** The vendor's risk: where it stands, and the two ratings that make it up. */
export function VendorRiskTab({ vendor }: { vendor: VendorResponse }) {
  return (
    <div className="flex flex-col gap-4">
      <Summary vendor={vendor} />
      <div className="grid gap-4 lg:grid-cols-2">
        <RiskPanel vendor={vendor} which="inherent" />
        <RiskPanel vendor={vendor} which="residual" />
      </div>
    </div>
  );
}

/** What has been decided about the risk, and what the company's measures did to it. */
export function VendorTreatmentTab({ vendor }: { vendor: VendorResponse }) {
  return (
    <div className="flex flex-col gap-4">
      <ReductionCard vendor={vendor} />
      <TreatmentCard
        // A new key when what is saved changes, so the card starts again from it.
        key={`${vendor.treatment}|${vendor.treatmentNote}`}
        vendor={vendor}
      />
    </div>
  );
}
