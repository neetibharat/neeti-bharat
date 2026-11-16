/** Locales the product ships. English only for now; `messages/hi.json` is parked until Hindi is reviewed. */
export const LOCALES = ['en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
