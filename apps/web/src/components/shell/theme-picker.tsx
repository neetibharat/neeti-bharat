'use client';

import { useTranslations } from 'next-intl';
import { SegmentedControl } from '@/components/base/segmented-control/segmented-control';
import { useTheme } from '@/lib/hooks/use-theme';
import { THEME_CHOICES } from '@/lib/theme';

/** Light, dark, or whatever the device uses. Remembered in this browser. */
export function ThemePicker() {
  const t = useTranslations('theme');
  const [choice, setChoice] = useTheme();

  return (
    <div className="flex flex-col gap-1.5 border-b border-line px-2.5 py-2">
      <p className="text-caption font-medium text-fg-subtle">{t('label')}</p>
      <SegmentedControl
        aria-label={t('label')}
        value={choice}
        onChange={setChoice}
        options={THEME_CHOICES.map((id) => ({ id, label: t(id) }))}
        className="w-full [&>*]:flex-1 [&>*]:px-2"
      />
    </div>
  );
}
