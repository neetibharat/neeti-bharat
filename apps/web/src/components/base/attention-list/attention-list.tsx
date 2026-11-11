import { IconCircleCheck } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/base/card/card';
import { IconLinkRow, type IconLinkRowProps } from '@/components/base/icon-link-row/icon-link-row';

export interface AttentionRow extends IconLinkRowProps {
  key: string;
}

export interface AttentionListProps {
  title: string;
  description: string;
  items: AttentionRow[];
  /** How many rows to show; the rest are counted. */
  maxRows: number;
  /** Said when there is nothing to do. */
  clearLabel: string;
  /** Says how many rows are not shown. */
  moreLabel: (count: number) => string;
  /** Anything to add under the rows, such as suggestions. */
  children?: ReactNode;
}

/** A card of the things that most need someone, as rows that open each one. */
export function AttentionList(props: AttentionListProps) {
  const { title, description, items, maxRows, clearLabel, moreLabel, children } = props;
  const hidden = items.length - maxRows;

  return (
    <Card title={title} description={description}>
      <div className="flex flex-col gap-3">
        {items.length === 0 && (
          <p className="flex items-center gap-2 text-body text-fg-muted">
            <IconCircleCheck className="size-5 text-success" />
            {clearLabel}
          </p>
        )}
        {items.length > 0 && (
          <ul className="flex flex-col gap-2">
            {items.slice(0, maxRows).map(({ key, ...row }) => (
              <IconLinkRow key={key} {...row} />
            ))}
          </ul>
        )}
        {children}
        {hidden > 0 && <p className="text-caption text-fg-muted">{moreLabel(hidden)}</p>}
      </div>
    </Card>
  );
}
