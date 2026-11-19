import { IconChevronRight } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export interface Crumb {
  label: string;
  /** Missing for the page the person is on. */
  href?: string;
}

const LINK = 'text-fg-muted hover:text-fg hover:underline';

/** Where this page sits, from the top down. Every part but the last is a link. */
export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const t = useTranslations('common');

  return (
    <nav aria-label={t('breadcrumb')} className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-label">
        {crumbs.map((crumb, index) => (
          <li key={`${index}-${crumb.label}`} className="flex items-center gap-1">
            {index > 0 && <IconChevronRight className="size-3.5 text-fg-subtle" aria-hidden />}
            {crumb.href ? (
              <Link href={crumb.href} className={LINK}>
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-fg">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
