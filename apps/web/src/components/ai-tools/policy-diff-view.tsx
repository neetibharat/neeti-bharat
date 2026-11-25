'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Button } from '@/components/base/button/button';
import {
  collapseSame,
  diffRows,
  plainLine,
  wordSegments,
  type DiffRow,
  type Segment,
} from '@/lib/policy-diff';
import { cx } from '@/lib/utils/cx';
import { useHumanise } from './use-humanise';

type Tone = 'same' | 'removed' | 'added';

const TONES: Record<Tone, { box: string; mark: string; word: string }> = {
  same: { box: 'text-fg-muted', mark: '', word: '' },
  removed: { box: 'bg-danger-soft/60 text-fg', mark: '−', word: 'bg-danger/20 line-through' },
  added: { box: 'bg-success-soft/60 text-fg', mark: '+', word: 'bg-success/20 font-medium' },
};

/** How a line of the text reads: a heading, a bullet, or a paragraph, without the Markdown signs. */
function shape(line: string): { kind: 'heading' | 'bullet' | 'text'; text: string } {
  const heading = /^#{1,6}\s+(.*)$/.exec(line);
  if (heading) return { kind: 'heading', text: heading[1]! };
  const bullet = /^[-*]\s+(.*)$/.exec(line);
  return bullet ? { kind: 'bullet', text: bullet[1]! } : { kind: 'text', text: line };
}

type Values = Readonly<Record<string, string>>;

function DiffLine(props: { line: string; tone: Tone; segments?: Segment[]; values: Values }) {
  const t = useTranslations('aiTools.diff');
  const humanise = useHumanise(props.values);
  const { kind, text } = shape(props.line);
  const tone = TONES[props.tone];
  // Segments are cut from the line with its Markdown signs, so they are cut again once the signs are off.
  const sign = props.line.length - text.length;
  const pieces = props.segments ?? [{ text: props.line, changed: false }];
  const body = trimStart(pieces, sign);

  return (
    <div className={cx('flex gap-3 px-3 py-1.5 text-body', tone.box)}>
      <span aria-hidden="true" className="w-3 shrink-0 text-center font-semibold">
        {tone.mark}
      </span>
      {props.tone !== 'same' && <span className="sr-only">{t(props.tone)}</span>}
      <p
        className={cx(
          'min-w-0 flex-1',
          kind === 'heading' && 'font-semibold text-fg',
          kind === 'bullet' && 'pl-4 -indent-4',
        )}
      >
        {kind === 'bullet' && <span aria-hidden="true">• </span>}
        {body.map((piece, index) => (
          <span key={index} className={cx(piece.changed && tone.word, 'rounded-sm')}>
            {humanise(piece.text)}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Drops the first `count` characters from a line that has been cut into pieces. */
function trimStart(pieces: Segment[], count: number): Segment[] {
  let left = count;
  return pieces.flatMap((piece) => {
    if (left <= 0) return [piece];
    const cut = Math.min(left, piece.text.length);
    left -= cut;
    const rest = piece.text.slice(cut);
    return rest ? [{ ...piece, text: rest }] : [];
  });
}

function Row({ row, values }: { row: DiffRow; values: Values }) {
  if (row.kind === 'same') return <DiffLine line={row.text} tone="same" values={values} />;
  if (row.kind === 'removed') return <DiffLine line={row.text} tone="removed" values={values} />;
  if (row.kind === 'added') return <DiffLine line={row.text} tone="added" values={values} />;
  const parts = wordSegments(row.before, row.after);

  return (
    <>
      <DiffLine line={row.before} tone="removed" segments={parts.before} values={values} />
      <DiffLine line={row.after} tone="added" segments={parts.after} values={values} />
    </>
  );
}

/**
 * What a rewrite changed, line by line, with the words that changed marked inside each line. Lines that did not change
 * are folded away until asked for, so a long policy shows only what matters.
 */
export function PolicyDiffView(props: { before: string[]; after: string[]; values: Values }) {
  const { before, after, values } = props;
  const t = useTranslations('aiTools.diff');
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(
    () => diffRows(before.map(plainLine), after.map(plainLine)),
    [before, after],
  );
  const shown = showAll ? rows : collapseSame(rows);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-3 text-caption text-fg-muted">
          <span className="rounded-sm bg-danger/20 px-1.5 line-through">{t('legendRemoved')}</span>
          <span className="rounded-sm bg-success/20 px-1.5 font-medium">{t('legendAdded')}</span>
        </p>
        <Button color="tertiary" size="sm" onPress={() => setShowAll((value) => !value)}>
          {showAll ? t('hideSame') : t('showSame')}
        </Button>
      </div>
      <div className="max-h-[44vh] overflow-y-auto rounded-control border border-line bg-surface py-1">
        {shown.map((row, index) =>
          row.kind === 'skipped' ? (
            <p key={index} className="px-3 py-1.5 text-center text-caption text-fg-subtle">
              {t('skipped', { count: row.count })}
            </p>
          ) : (
            <Row key={index} row={row} values={values} />
          ),
        )}
      </div>
    </div>
  );
}
