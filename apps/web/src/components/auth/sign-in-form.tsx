'use client';

import { IconMail } from '@tabler/icons-react';
import type { AuthProvidersResponse, ErrorCode } from '@neeti-bharat/shared';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Input } from '@/components/base/input/input';
import { authClient } from '@/lib/auth-client';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { SocialButtons } from './social-buttons';

type Status = 'idle' | 'sending' | 'sent';

function useMagicLinkRequest(initialError?: ErrorCode) {
  const errorMessage = useErrorMessage();
  const locale = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(
    initialError ? errorMessage({ code: initialError }) : null,
  );

  async function request(email: string) {
    setStatus('sending');
    setError(null);
    const { error: failure } = await authClient.signIn.magicLink({
      email,
      callbackURL: `/${locale}`,
    });
    if (failure)
      setError(errorMessage({ code: failure.status === 429 ? 'RATE_LIMITED' : 'INTERNAL' }));
    setStatus(failure ? 'idle' : 'sent');
  }

  return { status, error, request, reset: () => setStatus('idle') };
}

export interface SignInFormProps {
  providers: AuthProvidersResponse;
  /** Set when a Google or Microsoft sign-in came back refused. */
  initialError?: ErrorCode;
}

export function SignInForm({ providers, initialError }: SignInFormProps) {
  const t = useTranslations('auth.signIn');
  const [email, setEmail] = useState('');
  const { status, error, request, reset } = useMagicLinkRequest(initialError);

  function submit(event: FormEvent) {
    event.preventDefault();
    void request(email);
  }

  if (status === 'sent') return <SentNotice email={email} onReset={reset} />;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          type="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          iconLeading={IconMail}
          value={email}
          onChange={setEmail}
          isRequired
          autoFocus
        />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" size="lg" isLoading={status === 'sending'}>
          {t('submit')}
        </Button>
      </form>
      <SocialButtons providers={providers} />
      <p className="text-center text-label text-fg-subtle">{t('firstRunHint')}</p>
    </div>
  );
}

function SentNotice({ email, onReset }: { email: string; onReset: () => void }) {
  const t = useTranslations('auth.signIn');
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="success" title={t('sentTitle')}>
        {t('sentBody', { email })}
      </Alert>
      <Button color="secondary" onPress={onReset}>
        {t('useAnother')}
      </Button>
    </div>
  );
}
