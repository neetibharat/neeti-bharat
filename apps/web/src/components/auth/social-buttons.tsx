'use client';

import { IconBrandGoogle, IconBrandWindows, type Icon } from '@tabler/icons-react';
import type { AuthProvidersResponse } from '@dpdp-kit/shared';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/base/button/button';
import { authClient } from '@/lib/auth-client';

type ProviderId = keyof AuthProvidersResponse;

const PROVIDERS: {
  id: ProviderId;
  icon: Icon;
  label: 'continueWithGoogle' | 'continueWithMicrosoft';
}[] = [
  { id: 'google', icon: IconBrandGoogle, label: 'continueWithGoogle' },
  { id: 'microsoft', icon: IconBrandWindows, label: 'continueWithMicrosoft' },
];

/** "Continue with Google / Microsoft", for the providers the API has switched on. */
export function SocialButtons({ providers }: { providers: AuthProvidersResponse }) {
  const t = useTranslations('auth.signIn');
  const locale = useLocale();
  const enabled = PROVIDERS.filter(({ id }) => providers[id]);
  if (!enabled.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-label text-fg-subtle">{t('or')}</p>
      {enabled.map(({ id, icon, label }) => (
        <Button
          key={id}
          color="secondary"
          size="lg"
          iconLeading={icon}
          onPress={() =>
            authClient.signIn.social({
              provider: id,
              callbackURL: `/${locale}`,
              errorCallbackURL: `/${locale}/sign-in`,
            })
          }
        >
          {t(label)}
        </Button>
      ))}
    </div>
  );
}
