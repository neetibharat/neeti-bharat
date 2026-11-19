'use client';

import type { OrganizationSummary } from '@dpdp-kit/shared';
import { IconCheck, IconChevronDown, IconPlus } from '@tabler/icons-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Menu, MenuItem, MenuTrigger, Popover, Separator } from 'react-aria-components';
import { useRouter } from '@/i18n/navigation';
import { rememberOrganization } from '@/lib/active-organization';
import { useGetCompanyLogoQuery } from '@/lib/api/company-logo-api';
import { openApp } from '@/lib/open-app';

const NEW = '__new__';

/** The company logo, or the first letter of its name until one is uploaded. */
function OrganizationLogo({ name }: { name: string }) {
  const { data } = useGetCompanyLogoQuery(undefined, { refetchOnMountOrArgChange: true });

  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-control bg-brand-soft text-subtitle font-semibold text-brand"
    >
      {data?.logo ? (
        // The picture is on file storage at a short-lived link, so the image optimiser cannot be used.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.logo.url} alt="" className="size-full object-contain" />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}

export interface OrganizationHeaderProps {
  organizations: OrganizationSummary[];
  activeId: string;
}

/** The top of the sidebar: the organisation being worked in, with its logo, and a menu to move to another or start one. */
export function OrganizationHeader({ organizations, activeId }: OrganizationHeaderProps) {
  const t = useTranslations('organization.switcher');
  const router = useRouter();
  const locale = useLocale();
  const active = organizations.find((org) => org.id === activeId) ?? organizations[0]!;

  function choose(key: string | number) {
    if (key === NEW) return router.push('/new-organization');
    if (key === activeId) return;
    rememberOrganization(String(key));
    openApp(locale);
  }

  return (
    <MenuTrigger>
      <Button
        aria-label={t('label')}
        className="mx-3 mt-3 flex h-14 cursor-pointer items-center gap-3 rounded-control px-2 text-left outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent"
      >
        <OrganizationLogo name={active.name} />
        <span className="min-w-0 flex-1 truncate text-subtitle font-semibold text-fg">
          {active.name}
        </span>
        <IconChevronDown className="size-4 shrink-0 text-fg-subtle" />
      </Button>
      <OrganizationMenu organizations={organizations} activeId={activeId} onChoose={choose} />
    </MenuTrigger>
  );
}

interface OrganizationMenuProps extends OrganizationHeaderProps {
  onChoose: (key: string | number) => void;
}

function OrganizationMenu({ organizations, activeId, onChoose }: OrganizationMenuProps) {
  const t = useTranslations('organization.switcher');

  return (
    <Popover className="w-64 rounded-control border border-line bg-surface p-1 shadow-popover entering:animate-pop-in exiting:animate-fade-out">
      <Menu onAction={onChoose} className="outline-none">
        {organizations.map((org) => (
          <MenuItem key={org.id} id={org.id} textValue={org.name} className={itemClass}>
            <span className="min-w-0 flex-1 truncate">{org.name}</span>
            {org.id === activeId && <IconCheck className="size-4 text-brand" />}
          </MenuItem>
        ))}
        <Separator className="my-1 h-px bg-line" />
        <MenuItem id={NEW} textValue={t('create')} className={itemClass}>
          <IconPlus className="size-4 text-fg-subtle" />
          {t('create')}
        </MenuItem>
      </Menu>
    </Popover>
  );
}

const itemClass =
  'flex cursor-pointer items-center gap-2 rounded-[calc(var(--radius-control)-0.25rem)] px-2.5 py-2 text-body text-fg outline-none data-focused:bg-brand-soft';
