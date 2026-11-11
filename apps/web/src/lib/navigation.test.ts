import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { NAV_AREAS, areaForPath, firstLiveHref, isActivePath, itemsOf } from './navigation';

const items = NAV_AREAS.flatMap(itemsOf);

function routeFile(href: string): string {
  const folder = href === '/' ? '' : href;
  return resolve(__dirname, `../app/[locale]/(app)${folder}/page.tsx`);
}

describe('navigation', () => {
  it('has no two items on the same page', () => {
    const hrefs = items.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('has a route file for every item', () => {
    const missing = items.filter((item) => !existsSync(routeFile(item.href)));
    expect(missing.map((item) => item.href)).toEqual([]);
  });

  it('has a label for every area, section and item', () => {
    for (const area of NAV_AREAS) {
      expect(en.nav.areas).toHaveProperty(area.id);
      for (const section of area.sections) {
        if (section.id) expect(en.nav.sections).toHaveProperty(section.id);
      }
    }
    for (const item of items) expect(en.nav.items).toHaveProperty(item.id);
  });

  it('has page text for every module that is not built yet', () => {
    for (const item of items.filter((candidate) => candidate.status === 'soon')) {
      expect(en.pages).toHaveProperty(`${item.id}.title`);
      expect(en.pages).toHaveProperty(`${item.id}.description`);
    }
  });

  it('sends each area to a page that exists', () => {
    const live = items.filter((item) => item.status === 'live').map((item) => item.href);
    expect(live).toContain(firstLiveHref('settings'));
  });
});

describe('areaForPath', () => {
  it('finds the area a page belongs to', () => {
    expect(areaForPath('/').id).toBe('workspace');
    expect(areaForPath('/data-map').id).toBe('data');
    expect(areaForPath('/settings/people').id).toBe('settings');
  });

  it('falls back to the workspace for unknown pages', () => {
    expect(areaForPath('/nowhere').id).toBe('workspace');
  });
});

describe('isActivePath', () => {
  it('lights the dashboard only on the dashboard', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/frameworks', '/')).toBe(false);
  });

  it('lights an item for its own pages', () => {
    expect(isActivePath('/settings/people/new', '/settings/people')).toBe(true);
    expect(isActivePath('/settings/people-extra', '/settings/people')).toBe(false);
  });
});
