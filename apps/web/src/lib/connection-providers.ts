import {
  IconBrandAws,
  IconBrandAzure,
  IconBrandGithub,
  IconBrandGoogle,
  type Icon,
} from '@tabler/icons-react';

export const CATALOG_PROVIDER_IDS = ['azure', 'google_workspace', 'aws', 'github'] as const;
export type CatalogProviderId = (typeof CATALOG_PROVIDER_IDS)[number];

export const CATALOG_TAG_IDS = [
  'mfa',
  'encryption',
  'publicAccess',
  'dataLocation',
  'network',
  'logging',
  'people',
  'codeReview',
  'access',
] as const;
export type CatalogTagId = (typeof CATALOG_TAG_IDS)[number];

export interface CatalogProvider {
  id: CatalogProviderId;
  icon: Icon;
  /** False for a system that is on the list but cannot be connected yet. */
  available: boolean;
  /** What it checks, as short labels under `connections.catalog.tags`. */
  tags: readonly CatalogTagId[];
}

/** The systems the Connections page offers, in the order they are shown. Only the available ones have a form. */
export const CATALOG: readonly CatalogProvider[] = [
  {
    id: 'azure',
    icon: IconBrandAzure,
    available: true,
    tags: ['mfa', 'encryption', 'publicAccess', 'dataLocation', 'network', 'logging'],
  },
  { id: 'google_workspace', icon: IconBrandGoogle, available: false, tags: ['mfa', 'people'] },
  {
    id: 'aws',
    icon: IconBrandAws,
    available: false,
    tags: ['encryption', 'publicAccess', 'dataLocation', 'logging'],
  },
  { id: 'github', icon: IconBrandGithub, available: false, tags: ['codeReview', 'access'] },
];

/** How many tags a card shows before "+n more". */
export const TAGS_SHOWN = 3;
