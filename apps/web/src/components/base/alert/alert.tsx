import { IconAlertCircle, IconCircleCheck, IconInfoCircle, type Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/utils/cx';

type Tone = 'info' | 'success' | 'error';

export interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const tones: Record<Tone, { box: string; icon: Icon }> = {
  info: { box: 'border-brand-line bg-info-soft text-info', icon: IconInfoCircle },
  success: { box: 'border-success/30 bg-success-soft text-success', icon: IconCircleCheck },
  error: { box: 'border-danger/30 bg-danger-soft text-danger', icon: IconAlertCircle },
};

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { box, icon: ToneIcon } = tones[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-card border px-5 py-4 text-body', box, className)}
    >
      <ToneIcon className="mt-0.5 size-5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : undefined}>{children}</div>}
      </div>
    </div>
  );
}
