'use client';

import { RISK_POINTS, type RiskPoint, type VendorRating } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cx } from '@/lib/utils/cx';

type Axis = 'likelihood' | 'impact';

interface Draft {
  likelihood?: RiskPoint;
  impact?: RiskPoint;
}

/** One question with five numbered steps. The step chosen is named underneath. */
function ScaleRow(props: {
  axis: Axis;
  value: RiskPoint | undefined;
  isReadOnly: boolean;
  onPick: (point: RiskPoint) => void;
}) {
  const t = useTranslations('vendors.risk');
  const { axis, value } = props;

  return (
    <div className="flex flex-col gap-2">
      <p id={`scale-${axis}`} className="text-label font-medium text-fg">
        {t(`${axis}.question`)}
      </p>
      <div role="radiogroup" aria-labelledby={`scale-${axis}`} className="grid grid-cols-5 gap-1.5">
        {RISK_POINTS.map((point) => (
          <button
            key={point}
            type="button"
            role="radio"
            aria-checked={value === point}
            aria-label={`${point}: ${t(`${axis}.${point}`)}`}
            disabled={props.isReadOnly}
            onClick={() => props.onPick(point)}
            className={cx(
              'h-9 rounded-control text-label font-medium ring-1 ring-inset transition-colors',
              value === point
                ? 'bg-brand text-on-brand ring-brand'
                : 'bg-surface text-fg-muted ring-line-strong',
              !props.isReadOnly && value !== point && 'cursor-pointer hover:bg-surface-muted',
              props.isReadOnly && 'cursor-default',
            )}
          >
            {point}
          </button>
        ))}
      </div>
      <p className="min-h-4 text-caption text-fg-subtle">{value ? t(`${axis}.${value}`) : ''}</p>
    </div>
  );
}

export interface RatingPickerProps {
  rating: VendorRating | null;
  /** Where to start, offered while nothing is chosen. */
  suggested: VendorRating | null;
  isReadOnly: boolean;
  /** Called once both questions are answered, and again when either answer changes. */
  onChange: (rating: VendorRating) => void;
  onClear: () => void;
}

/** The two answers being given, and what happens as each is given. Both answered means a rating, which is saved. */
function useDraft(props: RatingPickerProps) {
  const [draft, setDraft] = useState<Draft>(props.rating ?? {});

  return {
    draft,
    started: draft.likelihood !== undefined || draft.impact !== undefined,
    pick(axis: Axis, point: RiskPoint) {
      const next = { ...draft, [axis]: point };
      setDraft(next);
      if (next.likelihood && next.impact) {
        props.onChange({ likelihood: next.likelihood, impact: next.impact });
      }
    },
    use(rating: VendorRating) {
      setDraft(rating);
      props.onChange(rating);
    },
    clear() {
      setDraft({});
      props.onClear();
    },
  };
}

const LINK = 'cursor-pointer underline underline-offset-2';

/** The one thing to offer: start from the suggestion while nothing is chosen, or start again once something is. */
function Offer(
  props: RatingPickerProps & { started: boolean; use: () => void; clear: () => void },
) {
  const t = useTranslations('vendors.risk');
  const { suggested } = props;

  if (props.started) {
    return (
      <button type="button" onClick={props.clear} className={`${LINK} text-fg-muted hover:text-fg`}>
        {t('clear')}
      </button>
    );
  }
  if (!suggested) return null;

  return (
    <button type="button" onClick={props.use} className={`${LINK} text-brand hover:no-underline`}>
      {t('useSuggestion', {
        likelihood: t(`likelihood.${suggested.likelihood}`),
        impact: t(`impact.${suggested.impact}`),
      })}
    </button>
  );
}

/** Two questions, how likely and how bad, each answered from 1 to 5. The rating is saved once both are answered. */
export function RatingPicker(props: RatingPickerProps) {
  const { draft, started, pick, use, clear } = useDraft(props);

  return (
    <div className="flex flex-col gap-4">
      <ScaleRow
        axis="likelihood"
        value={draft.likelihood}
        isReadOnly={props.isReadOnly}
        onPick={(p) => pick('likelihood', p)}
      />
      <ScaleRow
        axis="impact"
        value={draft.impact}
        isReadOnly={props.isReadOnly}
        onPick={(p) => pick('impact', p)}
      />
      {!props.isReadOnly && (
        <p className="text-caption">
          <Offer
            {...props}
            started={started}
            use={() => props.suggested && use(props.suggested)}
            clear={clear}
          />
        </p>
      )}
    </div>
  );
}
