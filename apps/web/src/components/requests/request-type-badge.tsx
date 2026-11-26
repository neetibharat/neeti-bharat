import type { RequestType } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@/components/base/badge/badge';

const COLORS: Record<RequestType, BadgeProps['color']> = {
  access: 'brand',
  correction: 'gray',
  erasure: 'warning',
  nomination: 'gray',
  complaint: 'danger',
};

/** What the person is asking for, as a small coloured label. */
export function RequestTypeBadge({ type }: { type: RequestType }) {
  const t = useTranslations('requests.types');
  return <Badge color={COLORS[type]}>{t(type)}</Badge>;
}
