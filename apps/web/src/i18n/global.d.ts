import type { Locale } from '@dpdp-kit/shared';
import type en from '../../messages/en.json';

// Makes translation keys type-checked against the English file.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en;
  }
}
