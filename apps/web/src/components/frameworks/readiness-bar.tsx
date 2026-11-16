import { ProgressBar } from '@/components/base/progress-bar/progress-bar';

export interface ReadinessBarProps {
  /** 0 to 100. */
  percent: number;
  label: string;
  className?: string;
}

/** A thin bar with the percentage beside it, for table rows. */
export function ReadinessBar({ percent, label, className }: ReadinessBarProps) {
  return <ProgressBar value={percent} label={label} showPercent className={className} />;
}
