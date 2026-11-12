'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { isActivePath, type NavArea, type NavSection } from '@/lib/navigation';
import { NavItem } from './nav-item';

export interface PanelProps {
  area: NavArea;
  pathname: string;
  /** Shown at the top, above the area's name. */
  header: ReactNode;
  /** Shown at the bottom, for example the signed-in person. */
  footer: ReactNode;
}

/** The pages of the selected area, under its name. */
export function Panel({ area, pathname, header, footer }: PanelProps) {
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
          <PanelSection key={section.id ?? index} section={section} pathname={pathname} />
        ))}
      </motion.nav>
      {footer}
    </div>
  );
}

function PanelSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const t = useTranslations('nav');
  return (
    <div className="flex flex-col gap-0.5">
      {section.id && (
        <p className="px-3 pb-1 text-caption font-medium tracking-wide text-fg-subtle uppercase">
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
