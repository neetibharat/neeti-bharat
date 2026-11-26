import type { PolicyCheckVerdict, ProofCheckVerdict } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@/components/base/badge/badge';

const POLICY: Record<PolicyCheckVerdict, NonNullable<BadgeProps['color']>> = {
  covered: 'success',
  partly: 'warning',
  missing: 'danger',
};

const PROOF: Record<ProofCheckVerdict, NonNullable<BadgeProps['color']>> = {
  matches: 'success',
  partly: 'warning',
  does_not_match: 'danger',
  unclear: 'gray',
};

/** How well a policy covers a control. */
export function PolicyVerdictBadge({ verdict }: { verdict: PolicyCheckVerdict }) {
  const t = useTranslations('aiTools.check.verdicts');
  return <Badge color={POLICY[verdict]}>{t(verdict)}</Badge>;
}

/** Whether a piece of proof looks like what was asked for. */
export function ProofVerdictBadge({ verdict }: { verdict: ProofCheckVerdict }) {
  const t = useTranslations('aiTools.proof.verdicts');
  return <Badge color={PROOF[verdict]}>{t(verdict)}</Badge>;
}
