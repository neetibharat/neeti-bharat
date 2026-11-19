'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { isActivePath, type NavArea, type NavSection } from '@/lib/navigation';
import { cx } from '@/lib/utils/cx';
import { NavItem } from './nav-item';

export interface PanelProps {
  area: NavArea;
  pathname: string;
  /** Shown at the top, above the area's name. */
  header: ReactNode;
}

/** The pages of the selected area, under its name. */
export function Panel({ area, pathname, header }: PanelProps) {
  const t = useTranslations('nav');

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {header}
      <h2 className="flex h-12 shrink-0 items-center px-5 text-label font-semibold tracking-wide text-fg-subtle uppercase">
        {t(`areas.${area.id}`)}
      </h2>
      <motion.nav
        key={area.id}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        aria-label={t(`areas.${area.id}`)}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3"
      >
        {area.sections.map((section, index) => (
          <PanelSection
            key={section.id ?? index}
            section={section}
            pathname={pathname}
            separated={index > 0}
          />
        ))}
      </motion.nav>
    </div>
  );
}

function PanelSection({
  section,
  pathname,
  separated,
}: {
  section: NavSection;
  pathname: string;
  /** A line above it, to set it apart from the run of pages before it. */
  separated: boolean;
}) {
  const t = useTranslations('nav');
  return (
    <div className={cx('flex flex-col gap-0.5', separated && 'border-t border-line pt-4')}>
      {/* The same type as the area's name above, and lined up with it, so both read as headings. */}
      {section.id && (
        <p className="px-2 pb-1 text-label font-semibold tracking-wide text-fg-subtle uppercase">
          {t(`sections.${section.id}`)}
        </p>
      )}
      {section.items.map((item) => (
        <NavItem
          key={item.id}
          href={item.href}
          label={t(`items.${item.id}`)}
          icon={item.icon}
          status={item.status}
          active={isActivePath(pathname, item.href)}
          soonLabel={t('soon')}
          layoutId="active-nav"
        />
      ))}
    </div>
  );
}
